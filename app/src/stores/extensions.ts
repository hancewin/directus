import type { ApiOutput } from '@directus/extensions';
import { APP_OR_HYBRID_EXTENSION_TYPES } from '@directus/extensions';
import { isIn } from '@directus/utils';
import { isEqual } from 'lodash';
import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useNotificationsStore } from './notifications';
import { readExtensions, updateExtension } from '@directus/sdk';
import sdk from '@/sdk';

const getEnabledBrowserExtensions = (extensions: ApiOutput[]) => {
	const enabledIds: string[] = [];

	for (const extension of extensions) {
		if (!extension.schema || !extension.schema.type) continue;

		if (isIn(extension.schema.type, APP_OR_HYBRID_EXTENSION_TYPES) && extension.meta.enabled) {
			enabledIds.push(extension.id);
		}

		if (extension.schema.type === 'bundle') {
			const nested = extensions.filter((child) => child.bundle === extension.id);
			const enabled = getEnabledBrowserExtensions(nested);

			enabledIds.push(...enabled);

			if (extension.schema.partial === false && enabled.length > 0) {
				enabledIds.push(extension.id);
			}
		}
	}

	return enabledIds;
};

// TODO create actual SDK commands for these

export const useExtensionsStore = defineStore('extensions', () => {
	const notificationsStore = useNotificationsStore();
	const { t } = useI18n();

	const loading = ref(false);
	const error = ref<unknown>(null);
	const extensions = ref<ApiOutput[]>([]);
	const reloadNotificationVisible = ref(false);

	const refresh = async (forceRefresh = true) => {
		loading.value = true;

		const currentlyEnabledBrowserExtensions = getEnabledBrowserExtensions(extensions.value);

		try {
			extensions.value = await sdk.request<ApiOutput[]>(readExtensions());

			const newEnabledBrowserExtensions = getEnabledBrowserExtensions(extensions.value);

			if (
				forceRefresh &&
				isEqual(currentlyEnabledBrowserExtensions, newEnabledBrowserExtensions) === false &&
				!reloadNotificationVisible.value
			) {
				notificationsStore.add({
					id: 'reload-required',
					title: t('reload_required'),
					text: t('extension_reload_required_copy'),
					type: 'warning',
					dialog: false,
					persist: true,
					alwaysShowText: true,
					dismissIcon: 'refresh',
					dismissText: t('extension_reload_now'),
					dismissAction: () => {
						window.location.reload();
					},
				});

				reloadNotificationVisible.value = true;
			}
		} catch (err) {
			error.value = err;
		} finally {
			loading.value = false;
		}
	};

	const toggleState = async (id: string) => {
		const extension = extensions.value.find((ext) => ext.id === id);

		if (!extension) throw new Error(`Extension with ID ${id} does not exist`);

		await sdk.request(updateExtension(extension.bundle, extension.id, { meta: { enabled: !extension.meta.enabled } }));

		await refresh();
	};

	const install = async (extensionId: string, versionId: string) => {
		await sdk.request(() => ({
			path: '/extensions/registry/install',
			method: 'POST',
			body: JSON.stringify({ extension: extensionId, version: versionId }),
		}));

		await refresh();
	};

	const uninstall = async (extensionId: string) => {
		await sdk.request(() => ({
			path: `/extensions/registry/uninstall/${extensionId}`,
			method: 'DELETE',
		}));

		await refresh();
	};

	const reinstall = async (extensionId: string) => {
		await sdk.request(() => ({
			path: `/extensions/registry/reinstall`,
			method: 'POST',
			body: JSON.stringify({ extension: extensionId })
		}));

		await refresh();
	};

	const remove = async (extensionId: string) => {
		await sdk.request(() => ({
			path: `/extensions/${extensionId}`,
			method: 'DELETE',
		}));

		await refresh();
	};

	const extensionIds = computed(() => extensions.value.map((ext) => ext.id));

	refresh(false);

	return { extensions, extensionIds, loading, error, refresh, toggleState, install, uninstall, reinstall, remove };
});

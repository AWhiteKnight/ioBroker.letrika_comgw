/* jshint -W097 */
/* jshint -W117 */
/* jshint -W119 */
/* jshint -W083 */
/* jslint esversion: 6 */
'use strict';

/**
 * @param {ioBroker.Adapter} adapter
 * @param {string} name
 */
async function createDeviceEntry(adapter, name) {
	await adapter.setObjectAsync(name, {
		type: 'device',
		common: {
			name: name
		},
		native: {}
	});
}

/**
 * @param {ioBroker.Adapter} adapter
 * @param {string} name
 */
async function createChannelEntry(adapter, name) {
	await adapter.setObjectAsync(name, {
		type: 'channel',
		common: {
			name: name
		},
		native: {}
	});
}

/**
 * @param {string} name
 * @param {string} type
 * @param {string} role
 */
async function createStateEntry(adapter, parent, name, type, role) {
	await adapter.setObjectAsync(parent+'.'+name, {
		type: 'state',
		common: {
			name: name,
			type: type,
			role: role
		},
		native: {}
	});
}

/**
 * Creates all entries needed for the inverter_info.
 */
module.exports.createInverterEntries = async (adapter, base) => {
	const device = adapter.namespace + '.'+  base.inverter;
	await createDeviceEntry(adapter, device);
	await createStateEntry(adapter, device, 'has_alert', 'boolean', 'indicator');
	await createStateEntry(adapter, device, 'hw_version', 'number', 'value');
	await createStateEntry(adapter, device, 'sw_version_pri', 'number', 'value');
	await createStateEntry(adapter, device, 'sw_version_sec', 'number', 'value');
	await createStateEntry(adapter, device, 'max_power', 'number', 'value');
	await createStateEntry(adapter, device, 'protocol_ver', 'number', 'value');
	await createStateEntry(adapter, device, 'status', 'boolean', 'indicator');
	let channel = device + '.measurement';
	await createChannelEntry(adapter, channel);
	await createStateEntry(adapter, channel, 'energy', 'number', 'value');
	await createStateEntry(adapter, channel, 'power', 'number', 'value');
	channel = device + '.details';
	await createChannelEntry(adapter, channel);
	await createStateEntry(adapter, channel, 'max_power_soft', 'number', 'value');
	await createStateEntry(adapter, channel, 'cos_phi', 'number', 'value');
	await createStateEntry(adapter, channel, 'power_status', 'boolean', 'indicator');
	await createStateEntry(adapter, channel, 'grid_freq', 'number', 'value');
	await createStateEntry(adapter, channel, 'dcdc_temp', 'number', 'value');
	await createStateEntry(adapter, channel, 'dcac_temp', 'number', 'value');
	await createStateEntry(adapter, channel, 'sec_dc_voltage', 'number', 'value');
	await createStateEntry(adapter, channel, 'alarm', 'number', 'value');
	adapter.setStateChangedAsync(base.inverter + '.has_alerts', {val: false, ack: true});
};


/**
 * handles settings.
 */
module.exports.handleSettings = async (adapter, data) => {
	await createStateEntry(adapter, adapter.namespace, 'has_alert', 'boolean', 'indicator');
	const device = adapter.namespace + '.settings';
	await createDeviceEntry(adapter, device);
	await createStateEntry(adapter, device, 'language', 'string', 'text');
	await createStateEntry(adapter, device, 'harvest_measurements_interval', 'number', 'value');
	await createStateEntry(adapter, device, 'harvest_status_interval', 'number', 'value');
	await createStateEntry(adapter, device, 'plant_id', 'string', 'text');
	await createStateEntry(adapter, device, 'username', 'string', 'text');
	await createStateEntry(adapter, device, 'system_configured', 'boolean', 'indicator');
	const channel = device + '.export';
	await createChannelEntry(adapter, channel);
	await createStateEntry(adapter, channel, 'type', 'string', 'text');
	await createStateEntry(adapter, channel, 'interval', 'number', 'value');
	await createStateEntry(adapter, channel, 'host', 'string', 'text');
	await createStateEntry(adapter, channel, 'url', 'string', 'text');
	await createStateEntry(adapter, channel, 'moidom_id', 'string', 'text');
	await adapter.setStateChangedAsync('has_alert', {val: false, ack: true});
	await adapter.setStateChangedAsync('settings.language', {val: data.language, ack: true});
	await adapter.setStateChangedAsync('settings.harvest_measurements_interval', {val: data.harvest_measurements_interval, ack: true});
	await adapter.setStateChangedAsync('settings.harvest_status_interval', {val: data.harvest_status_interval, ack: true});
	await adapter.setStateChangedAsync('settings.plant_id', {val: data.plant_id, ack: true});
	await adapter.setStateChangedAsync('settings.username', {val: data.username, ack: true});
	await adapter.setStateChangedAsync('settings.system_configured', {val: data.system_configured, ack: true});
	await adapter.setStateChangedAsync('settings.export.type', {val: data.export_type, ack: true});
	await adapter.setStateChangedAsync('settings.export.interval', {val: data.export_interval, ack: true});
	await adapter.setStateChangedAsync('settings.export.host', {val: data.export_host, ack: true});
	await adapter.setStateChangedAsync('settings.export.url', {val: data.export_url, ack: true});
	await adapter.setStateChangedAsync('settings.export.moidom_id', {val: data.export_moidom_id, ack: true});
};

/**
 * handles time_settings.
 */
module.exports.handleTimeSettings = async (adapter, data) => {
	const device = adapter.namespace + '.settings';
	await createDeviceEntry(adapter, device);
	await createStateEntry(adapter, device, 'location', 'string', 'text');
	await createStateEntry(adapter, device, 'timezone', 'string', 'text');
	await adapter.setStateChangedAsync('has_alert', {val: false, ack: true});
	await adapter.setStateChangedAsync('settings.location', {val: data.location, ack: true});
	await adapter.setStateChangedAsync('settings.timezone', {val: data.timezone, ack: true});
};

/**
 * handles network_settings.
 */
module.exports.handleNetworkSettings = async (adapter, data) => {
	const device = adapter.namespace + '.settings';
	await createDeviceEntry(adapter, device);
	const channel = device + '.network';
	await createChannelEntry(adapter, channel);
	await createStateEntry(adapter, channel, 'lan_mode', 'string', 'text');
	await createStateEntry(adapter, channel, 'lan_ip', 'string', 'text');
	await createStateEntry(adapter, channel, 'lan_mask', 'string', 'text');
	await createStateEntry(adapter, channel, 'lan_gateway', 'string', 'text');
	await createStateEntry(adapter, channel, 'lan_dns', 'string', 'text');
	await createStateEntry(adapter, channel, 'wlan_mode', 'string', 'text');
	await createStateEntry(adapter, channel, 'wlan_auth', 'string', 'text');
	await createStateEntry(adapter, channel, 'wlan_ssid', 'string', 'text');
	await createStateEntry(adapter, channel, 'wlan_ip', 'string', 'text');
	await createStateEntry(adapter, channel, 'wlan_mask', 'string', 'text');
	await createStateEntry(adapter, channel, 'wlan_gateway', 'string', 'text');
	await adapter.setStateChangedAsync('settings.network.lan_mode', {val: data.lan_mode, ack: true});
	await adapter.setStateChangedAsync('settings.network.lan_ip', {val: data.lan_ip, ack: true});
	await adapter.setStateChangedAsync('settings.network.lan_mask', {val: data.lan_mask, ack: true});
	await adapter.setStateChangedAsync('settings.network.lan_gateway', {val: data.lan_gateway, ack: true});
	await adapter.setStateChangedAsync('settings.network.lan_dns', {val: data.lan_dns, ack: true});
	await adapter.setStateChangedAsync('settings.network.wlan_mode', {val: data.wlan_mode, ack: true});
	await adapter.setStateChangedAsync('settings.network.wlan_auth', {val: data.wlan_auth, ack: true});
	await adapter.setStateChangedAsync('settings.network.wlan_ssid', {val: data.wlan_ssid, ack: true});
	await adapter.setStateChangedAsync('settings.network.wlan_ip', {val: data.wlan_ip, ack: true});
	await adapter.setStateChangedAsync('settings.network.wlan_mask', {val: data.wlan_mask, ack: true});
	await adapter.setStateChangedAsync('settings.network.wlan_gateway', {val: data.wlan_gateway, ack: true});
};

/**
 * handles cloud_settings.
 */
module.exports.handleCloudSettings = async (adapter, data) => {
	const device = adapter.namespace + '.settings';
	await createDeviceEntry(adapter, device);
	const channel = device + '.cloud';
	await createChannelEntry(adapter, channel);
	await createStateEntry(adapter, channel, 'url', 'string', 'text');
	await createStateEntry(adapter, channel, 'username', 'string', 'text');
	await createStateEntry(adapter, channel, 'password', 'string', 'text');
	await adapter.setStateChangedAsync('settings.cloud.url', {val: data.cloud_url, ack: true});
	await adapter.setStateChangedAsync('settings.cloud.username', {val: data.cloud_username, ack: true});
	await adapter.setStateChangedAsync('settings.cloud.password', {val: data.cloud_password, ack: true});
};

/**
 * create entries for system_info.
 */
module.exports.createSystemInfoEntries = async (adapter) => {
	const device = adapter.namespace + '.info';
	await createDeviceEntry(adapter, device);
	const channel = device + '.system';
	await createChannelEntry(adapter, channel);
	await createStateEntry(adapter, channel, 'sw_version', 'string', 'text');
	await createStateEntry(adapter, channel, 'sys_version', 'string', 'text');
	await createStateEntry(adapter, channel, 'storage_status', 'string', 'text');
	await createStateEntry(adapter, channel, 'storage_used', 'number', 'value');
	await createStateEntry(adapter, channel, 'storage_size', 'number', 'value');
};

/**
 * create entries for plant_info.
 */
module.exports.createPlantInfoEntries = async (adapter) => {
	const device = adapter.namespace + '.info';
	await createDeviceEntry(adapter, device);
	const channel = device + '.plant';
	await createChannelEntry(adapter, channel);
	await createStateEntry(adapter, channel, 'id', 'string', 'text');
	await createStateEntry(adapter, channel, 'country', 'string', 'text');
	await createStateEntry(adapter, channel, 'total_energy', 'number', 'value');
	await createStateEntry(adapter, channel, 'today_energy', 'number', 'value');
	await createStateEntry(adapter, channel, 'power', 'number', 'value');
	await createStateEntry(adapter, channel, 'cos_phi', 'number', 'value');
	await createStateEntry(adapter, channel, 'cos_phi_mode', 'number', 'value');
	await createStateEntry(adapter, channel, 'max_power', 'number', 'value');
	await createStateEntry(adapter, channel, 'status', 'string', 'text');
	await createStateEntry(adapter, channel, 'price_per_kw', 'number', 'value');
};

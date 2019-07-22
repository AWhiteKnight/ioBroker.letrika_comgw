/* jshint -W097 */
/* jshint -W117 */
/* jshint -W119 */
/* jshint -W083 */
/* jslint esversion: 6 */
'use strict';

function createDeviceEntry(adapter, parent, name) {
	let id = name;
	if(parent != null && parent !== '') {
		id = parent+'.'+name;
	}

	adapter.setObjectNotExists(id, {
		type: 'device',
		common: {
			name: name
		},
		native: {}
	});

    return id;
}

function createChannelEntry(adapter, parent, name) {
    const id = parent+'.'+name;
	adapter.setObjectNotExists(id, {
		type: 'channel',
		common: {
			name: name
		},
		native: {}
    });
    return id;
}

function createStateEntry(adapter, parent, newName, newType, newRole) {
	let id;
	if(parent != null && parent !== '')
		id = parent+'.'+newName;
	else 
		id = newName;

	adapter.setObjectNotExists(id, {
		type: 'state',
		common: {
			name: newName,
			type: newType,
			role: newRole
		},
		native: {}
    });
    return id;
}

/**
 * Creates all entries needed for the current configuration.
 * Device-Entries that have been deselected will be deleted. 
 */
module.exports.createInverterEntries = (adapter, base) => {
    adapter.log.debug('creating inverter entries for ' + base.inverter);
    const device = createDeviceEntry(adapter, adapter.namespace, base.inverter);
    let channel = device;
    createStateEntry(adapter, channel, 'hw_version', 'number', 'value');
    createStateEntry(adapter, channel, 'sw_version_pri', 'number', 'value');
    createStateEntry(adapter, channel, 'sw_version_sec', 'number', 'value');
    createStateEntry(adapter, channel, 'max_power', 'number', 'value');
    createStateEntry(adapter, channel, 'protocol_ver', 'number', 'value');
    createStateEntry(adapter, channel, 'status', 'boolean', 'indicator');
    channel = createChannelEntry(adapter, device, 'measurement');
    createStateEntry(adapter, channel, 'energy', 'number', 'value');
    createStateEntry(adapter, channel, 'power', 'number', 'value');
    channel = createChannelEntry(adapter, device, 'details');
    createStateEntry(adapter, channel, 'max_power_soft', 'number', 'value');
    createStateEntry(adapter, channel, 'cos_phi', 'number', 'value');
    createStateEntry(adapter, channel, 'power_status', 'boolean', 'indicator');
    createStateEntry(adapter, channel, 'grid_freq', 'number', 'value');
    createStateEntry(adapter, channel, 'dcdc_temp', 'number', 'value');
    createStateEntry(adapter, channel, 'dcac_temp', 'number', 'value');
    createStateEntry(adapter, channel, 'sec_dc_voltage', 'number', 'value');
    createStateEntry(adapter, channel, 'alarm', 'number', 'value');
};

/* eslint-disable linebreak-style */
import { API, DynamicPlatformPlugin, Logger, PlatformAccessory, PlatformConfig, Service, Characteristic } from 'homebridge';

import { PLATFORM_NAME, PLUGIN_NAME } from './settings';
import { KiwiBatteryServiceAccessory } from './KiwiBatteryServiceAccessory';

import axios from 'axios';

/**
 * HomebridgePlatform
 * This class is the main constructor for your plugin, this is where you should
 * parse the user config and discover/register accessories with Homebridge.
 */
export class KiwigridHomebridgePlatform implements DynamicPlatformPlugin {
  public readonly Service: typeof Service = this.api.hap.Service;
  public readonly Characteristic: typeof Characteristic = this.api.hap.Characteristic;

  // this is used to track restored cached accessories
  public readonly accessories: PlatformAccessory[] = [];
  private customPlatformAccessories: { [id: string]: IUpdatable; } = {};
 
  constructor(
    public readonly log: Logger,
    public readonly config: PlatformConfig,
    public readonly api: API,
  ) {
    this.log.debug('Finished initializing platform:', this.config.name);

    // When this event is fired it means Homebridge has restored all cached accessories from disk.
    // Dynamic Platform plugins should only register new accessories after this event was fired,
    // in order to ensure they weren't added to homebridge already. This event can also be used
    // to start discovery of new accessories.
    this.api.on('didFinishLaunching', () => {
      log.debug('Executed didFinishLaunching callback');

      const devicesUrl = 'http://' + this.config.ip + '/rest/kiwigrid/wizard/devices';

      // run the method to discover / register your devices as accessories
      this.updateDevices(devicesUrl, true);

      if (this.config.refreshIntervalMinutes > 0) {
        log.debug('Refresh interval set to ' + this.config.refreshIntervalMinutes);
        setInterval(() => {
          this.updateDevices(devicesUrl, false);
        }, this.config.refreshIntervalMinutes * 60 * 1000);
      } else {
        log.debug('No refresh interval set');
      }
    });
  }

  /**
   * This function is invoked when homebridge restores cached accessories from disk at startup.
   * It should be used to setup event handlers for characteristics and update respective values.
   */
  configureAccessory(accessory: PlatformAccessory) {
    this.log.debug('Loading accessory from cache:', accessory.displayName);

    // add the restored accessory to the accessories cache so we can track if it has already been registered
    this.accessories.push(accessory);
  }

  /**
   * This is an example method showing how to register discovered accessories.
   * Accessories must only be registered once, previously created accessories
   * must not be registered again to prevent "duplicate UUID" errors.
   */
  async updateDevices(url: string, firstRun: boolean) {

    this.log.debug('Reading devices from: ' + url);

    try {
      const response = await axios.get(url);
      const json = response.data;

      // loop over the discovered devices and register each one if it has not already been registered
      for (let i = 0; i < json.result.items.length; i++) {
        const item = json.result.items[i];
        const info = item.tagValues;

        if (info.StateOfCharge) {

          const battery = {
            Guid: item.guid,
            StateOfCharge: info.StateOfCharge.value,
            IsCharging: info.ModeConverter.value === 'CHARGING',
            Manufacturer: info.IdManufacturer.value,
            Name: info.IdName.value,
            Model: info.IdName.value,
            StateOfHealth: info.StateOfHealth.value,
            Temperature: info.TemperatureBattery.value,
            IsHealthy: info.StateDevice.value === 'OK',
            Firmware: info.IdFirmware.value,
            ModuleCount: info.CountBatteryModules.value,
            SerialNumber: info.IdSerialNumber.value,
            Updated: Date.now(),
          };

          // at least Solarwatt seems to put the SerialNumber into the Name
          battery.Name = battery.Name.replace(battery.SerialNumber, '').trim();

          this.log.debug('Battery info: ' + JSON.stringify(battery));

          if (firstRun) {
            this.RegisterBattery(battery);
          }

          this.UpdateBattery(battery);
        }
      }
    } catch (exception) {
      process.stderr.write(`ERROR received from ${url}: ${exception}\n`);
    }
  }

  private RegisterBattery(battery) {
    const uuid = battery.Guid;

    const existingAccessory = this.accessories.find(accessory => accessory.UUID === uuid);

    if (existingAccessory) {
      this.log.debug('Restoring existing accessory from cache:', existingAccessory.displayName);

      existingAccessory.context.device = battery;
      this.api.updatePlatformAccessories([existingAccessory]);

      this.customPlatformAccessories[uuid] = new KiwiBatteryServiceAccessory(this.log, this, existingAccessory);

    } else {
      this.log.debug('Adding new accessory:', battery.Name);

      const accessory = new this.api.platformAccessory(battery.Name, uuid, this.api.hap.Categories.SENSOR);

      accessory.context.device = battery;

      this.customPlatformAccessories[uuid] = new KiwiBatteryServiceAccessory(this.log, this, accessory);

      this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
    }
  }

  private UpdateBattery(battery) {
    const uuid = battery.Guid;

    const existingAccessory = this.accessories.find(accessory => accessory.UUID === uuid);

    if (existingAccessory) {
      this.log.debug('Update: Restoring existing accessory from cache:', existingAccessory.displayName);

      existingAccessory.context.device = battery;

      this.customPlatformAccessories[uuid].Update(existingAccessory);
      this.api.updatePlatformAccessories([existingAccessory]);
    }
  }
}

export interface IUpdatable {
  Update(accessory: PlatformAccessory);
}

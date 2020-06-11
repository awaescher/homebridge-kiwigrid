import { Service, PlatformAccessory, Logger, CharacteristicValue, CharacteristicSetCallback, CharacteristicGetCallback } from 'homebridge';

import { KiwigridHomebridgePlatform } from './KiwigridHomebridgePlatform';

/**
 * Platform Accessory
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 */
export class KiwiBatteryServiceAccessory {
  private service: Service;

  constructor(
    private readonly log: Logger,
    private readonly platform: KiwigridHomebridgePlatform,
    private readonly accessory: PlatformAccessory,
  ) {

    // set accessory information
    this.accessory.getService(this.platform.Service.AccessoryInformation)!
      .setCharacteristic(this.platform.Characteristic.Manufacturer, 'Default-Manufacturer')
      .setCharacteristic(this.platform.Characteristic.Model, 'Default-Model')
      .setCharacteristic(this.platform.Characteristic.SerialNumber, 'Default-Serial');

    // get the BatteryService service if it exists, otherwise create a new BatteryService service
    // you can create multiple services for each accessory
    this.service = this.accessory.getService(this.platform.Service.BatteryService) || this.accessory.addService(this.platform.Service.BatteryService);

    // To avoid "Cannot add a Service with the same UUID another Service without also defining a unique 'subtype' property." error,
    // when creating multiple services of the same type, you need to use the following syntax to specify a name and subtype id:
    // this.accessory.getService('NAME') ?? this.accessory.addService(this.platform.Service.Lightbulb, 'NAME', 'USER_DEFINED_SUBTYPE');

    // set the service name, this is what is displayed as the default name on the Home app
    // in this example we are using the name we stored in the `accessory.context` in the `discoverDevices` method.
    this.service.setCharacteristic(this.platform.Characteristic.Name, 'Kiwi');

    // create handlers for required characteristics
    this.service.getCharacteristic(this.platform.Characteristic.BatteryLevel)
      .on('get', this.handleBatteryLevelGet.bind(this));
  
    this.service.getCharacteristic(this.platform.Characteristic.ChargingState)
      .on('get', this.handleChargingStateGet.bind(this));
  
    this.service.getCharacteristic(this.platform.Characteristic.StatusLowBattery)
      .on('get', this.handleStatusLowBatteryGet.bind(this));
  }

  
  /**
     * Handle requests to get the current value of the "Battery Level" characteristic
     */
  handleBatteryLevelGet(callback) {
    this.log.debug('Triggered GET BatteryLevel');
  
    // set this to a valid value for BatteryLevel
    // 0 - 100
    const currentValue = 15;
  
    callback(null, currentValue);
  }
  
  
  /**
     * Handle requests to get the current value of the "Charging State" characteristic
     */
  handleChargingStateGet(callback) {
    this.log.debug('Triggered GET ChargingState');
  
    // set this to a valid value for ChargingState
    // 0 NOT_CHARGING
    // 1 CHARGING
    // 2 NOT_CHARGEABLE
    const currentValue = 1;
  
    callback(null, currentValue);
  }
  
  
  /**
     * Handle requests to get the current value of the "Status Low Battery" characteristic
     */
  handleStatusLowBatteryGet(callback) {
    this.log.debug('Triggered GET StatusLowBattery');
  
    // set this to a valid value for StatusLowBattery
    // 0 NORMAL
    // 1 LOW
    const currentValue = 1;
  
    callback(null, currentValue);
  }
}

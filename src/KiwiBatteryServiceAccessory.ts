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

    const battery = accessory.context.device;

    // set accessory information
    this.accessory.getService(this.platform.Service.AccessoryInformation)!
      .setCharacteristic(this.platform.Characteristic.Manufacturer, battery.Manufacturer)
      .setCharacteristic(this.platform.Characteristic.Model, battery.Model)
      .setCharacteristic(this.platform.Characteristic.Identifier, battery.Guid)
      .setCharacteristic(this.platform.Characteristic.FirmwareRevision, battery.Firmware)
      .setCharacteristic(this.platform.Characteristic.TemperatureDisplayUnits, 0) // 0=Celsius, 1=Fahrenheit
      .setCharacteristic(this.platform.Characteristic.SerialNumber, battery.SerialNumber);

    // get the BatteryService service if it exists, otherwise create a new BatteryService service
    // you can create multiple services for each accessory
    //this.service = this.accessory.getService(this.platform.Service.BatteryService) || this.accessory.addService(this.platform.Service.BatteryService);
    this.service = this.accessory.getService(this.platform.Service.HumiditySensor) || this.accessory.addService(this.platform.Service.HumiditySensor);

    // To avoid "Cannot add a Service with the same UUID another Service without also defining a unique 'subtype' property." error,
    // when creating multiple services of the same type, you need to use the following syntax to specify a name and subtype id:
    // this.accessory.getService('NAME') ?? this.accessory.addService(this.platform.Service.Lightbulb, 'NAME', 'USER_DEFINED_SUBTYPE');

    // set the service name, this is what is displayed as the default name on the Home app
    // in this example we are using the name we stored in the `accessory.context` in the `discoverDevices` method.
    this.service.setCharacteristic(this.platform.Characteristic.Name, battery.Name);

    // create handlers for required characteristics
    this.service.getCharacteristic(this.platform.Characteristic.BatteryLevel)
      .on('get', this.handleBatteryLevelGet.bind(this));
    this.service.getCharacteristic(this.platform.Characteristic.CurrentRelativeHumidity)
      .on('get', this.handleBatteryLevelGet.bind(this));

    this.service.getCharacteristic(this.platform.Characteristic.ChargingState)
      .on('get', this.handleChargingStateGet.bind(this));

    this.service.getCharacteristic(this.platform.Characteristic.StatusLowBattery)
      .on('get', this.handleStatusLowBatteryGet.bind(this));

    this.service.getCharacteristic(this.platform.Characteristic.CurrentTemperature)
      .on('get', this.handleCurrentTemperatureBatteryGet.bind(this));

    this.service.getCharacteristic(this.platform.Characteristic.StatusFault)
      .on('get', this.handleStatusFaultBatteryGet.bind(this));
  }


  /**
     * Handle requests to get the current value of the "Battery Level" characteristic
     */
  handleBatteryLevelGet(callback) {

    // set this to a valid value for BatteryLevel
    // 0 - 100
    const battery = this.accessory.context.device;
    this.log.debug(`Triggered GET BatteryLevel (value: ${battery.StateOfCharge} updated:${battery.Updated})`);

    callback(null, battery.StateOfCharge);
  }


  /**
     * Handle requests to get the current value of the "Charging State" characteristic
     */
  handleChargingStateGet(callback) {

    // set this to a valid value for ChargingState
    // 0 NOT_CHARGING
    // 1 CHARGING
    // 2 NOT_CHARGEABLE
    const battery = this.accessory.context.device;
    const mapped = ((battery.IsCharging) ? 1 : 0);

    this.log.debug(`Triggered GET ChargingState (value: ${mapped} updated:${battery.Updated})`);
    
    callback(null, mapped);
  }


  /**
     * Handle requests to get the current value of the "Status Low Battery" characteristic
     */
  handleStatusLowBatteryGet(callback) {

    // set this to a valid value for StatusLowBattery
    // 0 NORMAL
    // 1 LOW
    const battery = this.accessory.context.device;
    const mapped = ((battery.StateOfCharge > 20) ? 0 : 1);

    this.log.debug(`Triggered GET StatusLowBattery (value: ${mapped} updated:${battery.Updated})`);

    callback(null, mapped);
  }

  /**
     * Handle requests to get the current value of the "Current Temperature" characteristic
     */
  handleCurrentTemperatureBatteryGet(callback) {

    const battery = this.accessory.context.device;

    this.log.debug(`Triggered GET CurrentTemperature (value: ${battery.Temperature} updated:${battery.Updated})`);

    callback(null, battery.Temperature);
  }

  
  /**
     * Handle requests to get the current value of the "Status Fault" characteristic
     */
  handleStatusFaultBatteryGet(callback) {

    // NO_FAULT = 0
    // GENERAL_FAULT = 1
    const battery = this.accessory.context.device;
    const mapped = ((battery.IsHealthy) ? 0 : 1);

    this.log.debug(`Triggered GET StatusFault (value: ${mapped} updated:${battery.Updated})`);

    callback(null, mapped);
  }
}

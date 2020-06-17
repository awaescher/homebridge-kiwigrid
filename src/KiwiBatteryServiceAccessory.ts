import { Service, PlatformAccessory, Logger, CharacteristicValue, CharacteristicSetCallback, CharacteristicGetCallback } from 'homebridge';

import { KiwigridHomebridgePlatform, IUpdatable } from './KiwigridHomebridgePlatform';

/**
 * Platform Accessory
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 */
export class KiwiBatteryServiceAccessory implements IUpdatable {
  private batteryService: Service;
  private humidityService: Service;

  constructor(
    private readonly log: Logger,
    private readonly platform: KiwigridHomebridgePlatform,
    private readonly accessory: PlatformAccessory,
  ) {

    const battery = accessory.context.device;

    // set accessory information
    const accessoryService = this.accessory.getService(this.platform.Service.AccessoryInformation)!;

    accessoryService
      .setCharacteristic(this.platform.Characteristic.Manufacturer, battery.Manufacturer)
      .setCharacteristic(this.platform.Characteristic.Model, battery.Model)
      .setCharacteristic(this.platform.Characteristic.Identifier, battery.Guid)
      .setCharacteristic(this.platform.Characteristic.FirmwareRevision, battery.Firmware)
      .setCharacteristic(this.platform.Characteristic.TemperatureDisplayUnits, 0) // 0=Celsius, 1=Fahrenheit
      .setCharacteristic(this.platform.Characteristic.SerialNumber, battery.SerialNumber);

    // get the BatteryService service if it exists, otherwise create a new BatteryService service
    // you can create multiple services for each accessory
    this.batteryService = this.accessory.getService(this.platform.Service.BatteryService) || this.accessory.addService(this.platform.Service.BatteryService);
    this.batteryService.setCharacteristic(this.platform.Characteristic.Name, battery.Name);

    // HUMIDITY SERVICE (HACK to have a sensor with a battery attached - HomeKit does not support batteries as standalone yet)
    this.humidityService = this.accessory.getService(this.platform.Service.HumiditySensor) || this.accessory.addService(this.platform.Service.HumiditySensor);
    this.humidityService.setCharacteristic(this.platform.Characteristic.Name, battery.Name);
  }

  Update(accessory: PlatformAccessory) {
    const battery = accessory.context.device;

    const batteryLevel = Math.round(battery.StateOfCharge); // 0 - 100
    const chargingState = ((battery.IsCharging) ? 1 : 0); // 0 NOT_CHARGING 1 CHARGING 2 NOT_CHARGEABLE
    const statusLowBattery = ((battery.StateOfCharge > 20) ? 0 : 1); // 0 NORMAL 1 LOW
    const temperature = battery.Temperature;
    const faultState = ((battery.IsHealthy) ? 0 : 1); // NO_FAULT = 0 GENERAL_FAULT = 1

    this.batteryService.getCharacteristic(this.platform.Characteristic.BatteryLevel).updateValue(batteryLevel);
    this.batteryService.getCharacteristic(this.platform.Characteristic.ChargingState).updateValue(chargingState);
    this.batteryService.getCharacteristic(this.platform.Characteristic.StatusLowBattery).updateValue(statusLowBattery);
    this.batteryService.getCharacteristic(this.platform.Characteristic.CurrentTemperature).updateValue(temperature);
    this.batteryService.getCharacteristic(this.platform.Characteristic.StatusFault).updateValue(faultState);

    this.humidityService.getCharacteristic(this.platform.Characteristic.CurrentRelativeHumidity).updateValue(batteryLevel);

    this.log.debug('Battery updated');
  }
}

import { Service, PlatformAccessory, Logger, CharacteristicValue, CharacteristicSetCallback, CharacteristicGetCallback } from 'homebridge';

import { KiwigridHomebridgePlatform, IUpdatable } from './KiwigridHomebridgePlatform';

/**
 * Platform Accessory
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 */
export class LiveStatsServiceAccessory implements IUpdatable {
  private statsService: Service;

  constructor(
    private readonly log: Logger,
    private readonly platform: KiwigridHomebridgePlatform,
    private readonly accessory: PlatformAccessory,
  ) {

    const stats = accessory.context.device;

    // set accessory information
    const accessoryService = this.accessory.getService(this.platform.Service.AccessoryInformation)!;

    accessoryService
      .setCharacteristic(this.platform.Characteristic.Manufacturer, 'Andreas Wäscher')
      .setCharacteristic(this.platform.Characteristic.Model, stats.Name)
      .setCharacteristic(this.platform.Characteristic.Identifier, stats.Guid);

    this.statsService = this.accessory.getService(this.platform.Service.Fan) || this.accessory.addService(this.platform.Service.Fan);
  }

  Update(accessory: PlatformAccessory) {
    const stats = accessory.context.device;

    this.statsService.getCharacteristic(this.platform.Characteristic.Name).updateValue(stats.Emoji + ' ' + this.formatWatts(stats.Value));
    this.statsService.getCharacteristic(this.platform.Characteristic.RotationDirection).updateValue((stats.PositiveBalance) ? 0 : 1);
    this.statsService.getCharacteristic(this.platform.Characteristic.On).updateValue(stats.Value > 0);

    this.log.debug(`Stats ${stats.Name} updated`);
  }

  formatWatts(watts: number) {
    if (watts > 1000) {
      return `${(watts/1000).toFixed(2)}kW`;
    }

    return `${Math.round(watts)}W`;
  }
}

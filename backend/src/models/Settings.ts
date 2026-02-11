import { getDatabase } from '../database/db';

export interface Settings {
  deliveryCityPrice: number;
  deliveryOutskirtsPrice: number;
  freeDeliveryThreshold: number;
  seasonalTheme: 'winter' | 'spring' | 'summer' | 'autumn';
  shopName: string;
  shopPhone: string;
  shopAddressCvetochaya: string;
  shopAddressFlorenciya: string;
  workingHours: string;
}

export class SettingsModel {
  static async getAll(): Promise<Settings> {
    return new Promise((resolve, reject) => {
      const db = getDatabase();
      db.all('SELECT key, value FROM settings', [], (err, rows: any[]) => {
        if (err) {
          reject(err);
          return;
        }

        const settingsMap = new Map(rows.map(r => [r.key, r.value]));

        resolve({
          deliveryCityPrice: parseInt(settingsMap.get('delivery_city_price') || '500'),
          deliveryOutskirtsPrice: parseInt(settingsMap.get('delivery_outskirts_price') || '800'),
          freeDeliveryThreshold: parseInt(settingsMap.get('free_delivery_threshold') || '3000'),
          seasonalTheme: (settingsMap.get('seasonal_theme') || 'spring') as Settings['seasonalTheme'],
          shopName: settingsMap.get('shop_name') || 'Цветочная лавка',
          shopPhone: settingsMap.get('shop_phone') || '+7 (999) 000-00-00',
          shopAddressCvetochaya: settingsMap.get('shop_address_cvetochaya') || 'ул. Цветочная, 1',
          shopAddressFlorenciya: settingsMap.get('shop_address_florenciya') || 'ул. Роз, 15',
          workingHours: settingsMap.get('working_hours') || '9:00 - 21:00',
        });
      });
    });
  }

  static async get(key: string): Promise<string | null> {
    return new Promise((resolve, reject) => {
      const db = getDatabase();
      db.get('SELECT value FROM settings WHERE key = ?', [key], (err, row: any) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(row?.value || null);
      });
    });
  }

  static async set(key: string, value: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const db = getDatabase();
      db.run(
        `INSERT INTO settings (key, value) VALUES (?, ?)
         ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP`,
        [key, value],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  }

  static async updateMultiple(settings: Partial<Settings>): Promise<void> {
    const db = getDatabase();
    const keyMap: Record<string, string> = {
      deliveryCityPrice: 'delivery_city_price',
      deliveryOutskirtsPrice: 'delivery_outskirts_price',
      freeDeliveryThreshold: 'free_delivery_threshold',
      seasonalTheme: 'seasonal_theme',
      shopName: 'shop_name',
      shopPhone: 'shop_phone',
      shopAddressCvetochaya: 'shop_address_cvetochaya',
      shopAddressFlorenciya: 'shop_address_florenciya',
      workingHours: 'working_hours',
    };

    for (const [key, value] of Object.entries(settings)) {
      if (value !== undefined && keyMap[key]) {
        await this.set(keyMap[key], String(value));
      }
    }
  }
}

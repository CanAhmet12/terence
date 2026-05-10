<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;

class SystemSetting extends Model
{
    protected $table = 'system_settings';

    protected $primaryKey = 'key';

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = ['key', 'value'];

    public const CACHE_PREFIX = 'sys_setting_';

    public static function cacheKey(string $key): string
    {
        return self::CACHE_PREFIX . $key;
    }

    public static function getRaw(string $key, ?string $default = null): ?string
    {
        $row = static::query()->where('key', $key)->value('value');

        return $row !== null && $row !== '' ? (string) $row : $default;
    }

    public static function maintenanceEnabled(): bool
    {
        return (bool) Cache::remember(self::cacheKey('maintenance_mode'), 30, function () {
            $v = static::getRaw('maintenance_mode', '0');

            return $v === '1' || $v === 'true' || $v === 'yes';
        });
    }

    public static function forgetCached(string $key): void
    {
        Cache::forget(self::cacheKey($key));
    }

    public static function put(string $key, string $value): void
    {
        $model = static::query()->firstOrNew(['key' => $key]);
        $model->value = $value;
        $model->save();
        self::forgetCached($key);
    }
}

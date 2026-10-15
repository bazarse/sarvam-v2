UPDATE "sarvam_v2"."Device"
SET "lastLatitude" = 22.7196 + (random() - 0.5) * 0.12,
    "lastLongitude" = 75.8577 + (random() - 0.5) * 0.12,
    "lastLocationAt" = NOW(),
    "lastOnlineAt" = NOW(),
    "batteryLevel" = 40 + floor(random() * 60)::int,
    "batteryHealth" = 'Good',
    "isCharging" = (random() > 0.5);

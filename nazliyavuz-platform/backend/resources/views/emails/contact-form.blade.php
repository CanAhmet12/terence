<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>İletişim Formu</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .container { background: #fff; padding: 30px; border-radius: 10px; border: 1px solid #e5e7eb; }
        .label { font-weight: 600; color: #64748b; font-size: 12px; text-transform: uppercase; margin-bottom: 4px; }
        .value { margin-bottom: 16px; }
        .message { background: #f8fafc; padding: 16px; border-radius: 8px; white-space: pre-wrap; }
    </style>
</head>
<body>
    <div class="container">
        <h2 style="margin-top:0;">Yeni İletişim Mesajı</h2>
        <p class="label">Ad Soyad</p>
        <p class="value">{{ $name }}</p>
        <p class="label">E-posta</p>
        <p class="value"><a href="mailto:{{ $email }}">{{ $email }}</a></p>
        <p class="label">Konu</p>
        <p class="value">{{ $konu_label ?? $konu }}</p>
        <p class="label">Mesaj</p>
        <div class="message">{{ $mesaj }}</div>
    </div>
</body>
</html>

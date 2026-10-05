<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ $subjectLine ?? 'Raabta Matrimonial Notification' }}</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            background-color: #0b1120;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            color: #334155;
            -webkit-font-smoothing: antialiased;
        }
        .wrapper {
            width: 100%;
            background-color: #0b1120;
            padding: 30px 10px;
            box-sizing: border-box;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.25);
            border: 1px solid #1e293b;
        }
        .header {
            background: linear-gradient(135deg, #1e1b4b 0%, #311042 50%, #1e1b4b 100%);
            padding: 28px 24px;
            text-align: center;
            border-bottom: 2px solid #e11d48;
        }
        .logo-title {
            color: #ffffff;
            font-size: 22px;
            font-weight: 800;
            letter-spacing: 0.5px;
            margin: 0;
            font-family: 'Georgia', serif;
        }
        .logo-tagline {
            color: #fbcfe8;
            font-size: 12px;
            margin-top: 4px;
            letter-spacing: 1px;
            text-transform: uppercase;
        }
        .body-content {
            padding: 32px 28px;
            line-height: 1.65;
            font-size: 15px;
            color: #1e293b;
        }
        .greeting {
            font-size: 17px;
            font-weight: 700;
            color: #0f172a;
            margin-bottom: 16px;
        }
        .message-text {
            color: #334155;
            white-space: pre-line;
            line-height: 1.7;
            font-size: 14.5px;
        }
        .cta-container {
            margin-top: 28px;
            text-align: center;
        }
        .cta-btn {
            display: inline-block;
            background: linear-gradient(135deg, #e11d48 0%, #be123c 100%);
            color: #ffffff !important;
            padding: 12px 28px;
            font-size: 14px;
            font-weight: 700;
            text-decoration: none;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(225, 29, 72, 0.35);
        }
        .footer {
            background-color: #f8fafc;
            padding: 20px 24px;
            text-align: center;
            border-top: 1px solid #e2e8f0;
            font-size: 12px;
            color: #64748b;
        }
        .footer a {
            color: #e11d48;
            text-decoration: none;
        }
    </style>
</head>
<body>
    <div class="wrapper">
        <div class="container">
            <!-- Header -->
            <div class="header">
                <div class="logo-title">💍 Raabta Matrimonial</div>
                <div class="logo-tagline">Dignified & Confidential Matchmaking</div>
            </div>

            <!-- Body -->
            <div class="body-content">
                @if(!empty($recipientName))
                    <div class="greeting">Assalam-o-Alaikum {{ $recipientName }},</div>
                @else
                    <div class="greeting">Assalam-o-Alaikum,</div>
                @endif

                <div class="message-text">{!! nl2br(e($messageBody)) !!}</div>

                @if(!empty($ctaUrl))
                    <div class="cta-container">
                        <a href="{{ $ctaUrl }}" class="cta-btn" target="_blank">{{ $ctaText ?? 'Visit Raabta Portal' }}</a>
                    </div>
                @endif
            </div>

            <!-- Footer -->
            <div class="footer">
                <p style="margin: 0 0 6px 0;">This email was sent by <strong>Raabta Matrimonial Support Team</strong>.</p>
                <p style="margin: 0;">Need help? Email us at <a href="mailto:support@raabtanow.com">support@raabtanow.com</a> | Visit: <a href="https://raabtanow.com">raabtanow.com</a></p>
            </div>
        </div>
    </div>
</body>
</html>

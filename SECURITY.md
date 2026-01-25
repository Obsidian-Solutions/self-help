# Security Policy

## Supported Versions

We only support the latest version of the MindFull Hugo Theme.

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

We take the security of our users seriously. If you discover a security vulnerability, please do NOT open a public issue. Instead, please report it via the following process:

1.  **Email:** Send an email to contact@obsidiansolutions.co.uk
2.  **Details:** Include as much detail as possible, including steps to reproduce and potential impact.
3.  **Acknowledgement:** You will receive an acknowledgement within 48 hours.
4.  **Disclosure:** We follow a responsible disclosure policy. We ask that you do not disclose the vulnerability publicly until we have had a chance to address it.

## Best Practices for Users

- **Secrets:** Never commit your `.env` file or any secrets to a public repository.
- **Dependencies:** Keep your `node_modules` and Hugo version up to date.
- **Hosting:** Ensure your hosting provider uses HTTPS and has proper security headers enabled.
- **Data Privacy:** This theme is designed to be privacy-first. By default, user data is stored in `localStorage`. If you integrate a backend, ensure you follow industry standards for data protection (GDPR, etc.).

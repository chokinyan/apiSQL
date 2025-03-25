# Creating a Local SSL Certificate on Windows

Here are two approaches to create self-signed SSL certificates for local development:

## Option 1: Using mkcert (recommended for developers)

1. **Install mkcert** using Chocolatey package manager:

   ```powershell
   # Install Chocolatey first if you don't have it
   Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

   # Install mkcert
   choco install mkcert
   ```

2. **Generate certificate and install local CA**:

   ```powershell
   # Install the local CA in the system trust store
   mkcert -install

   # Create certificate for localhost
   mkcert localhost 127.0.0.1 ::1
   ```

3. This creates `localhost+2.pem` (certificate) and `localhost+2-key.pem` (private key) files in your current directory.

## Option 2: Using OpenSSL

1. **Install OpenSSL** using Chocolatey:

   ```powershell
   choco install openssl
   ```

2. **Create a private key and certificate**:

   ```powershell
   # Generate private key
   openssl genrsa -out localhost.key 2048

   # Generate certificate signing request
   openssl req -new -key localhost.key -out localhost.csr -subj "/CN=localhost"

   # Generate self-signed certificate (valid for 365 days)
   openssl x509 -req -days 365 -in localhost.csr -signkey localhost.key -out localhost.crt
   ```

3. **Add the certificate to trusted root certificates**:
   - Double-click the `.crt` file
   - Select "Install Certificate"
   - Select "Local Machine" → "Place all certificates in the following store" → "Trusted Root Certification Authorities"

Remember to configure your application to use these certificate files when setting up HTTPS.

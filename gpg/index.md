<!--
-rw-r--r--. 1 guest guest  3175 Jan  1 00:00 contact
-rw-r--r--. 1 guest guest  3159 Jan  1 00:00 git
-rw-r--r--. 1 guest guest  3902 Jan  1 00:00 index
-rw-r--r--. 1 guest guest  3183 Jan  1 00:00 mail
-->
# Sending Encrypted Email (GPG / OpenPGP)

I encourage encrypted email for privacy and security. Here are some instructions to get started if you don't know how!

**STEP 1**: Set up your mail application

Follow the instructions for whatever you already use, or try installing Thunderbird on all major platforms:

**Thunderbird**

Thunderbird has OpenPGP build in, but you'll need to generate a key (below)

1. Install Thunderbird: https://www.thunderbird.net/
2. Open **Settings → Account Settings → End-to-End Encryption → Add Key → Import Existing Key**
3. Import your key
4. When sending to someone the first time use **OpenPGP → Key Assistant** to find their key or import it from a file
5. Ensure that you enable Encryption when composing mail

**Apple Mail (Mac)**

1. Install [GPG Suite](https://gpgtools.org)
2. Open **GPG Keychain**
3. In Mail, compose → click the lock icon to encrypt

**Gmail (Web)**

Gmail doesn’t support OpenPGP directly, but you can use the [FlowCrypt](https://flowcrypt.com) extension.

**Outlook (Windows desktop)**

Outlook doesn’t natively support OpenPGP, but you can use [GPG4Win](https://gpg4win.org).

**Other**

Find a compatible plugin or client [here](https://www.openpgp.org/software).

**STEP 2**: Create Your Own Key (if not provided by your application)

To receive encrypted replies, you’ll need your own key.

You can use a web tool that you trust, perhaps [this one](https://pgpkeygenerator.com/), but be aware that the private key is extremely sensitive, so you may wish to use one of the other options to guarantee its privacy.

**Linux**

Your system may already have **gnupg** installed. If not, find it in your system's repositories.

**macOS**

Install **gnupg** with Homebrew: **brew install gnupg**

**Windows**

**Gnupg** is included with [**GPG4Win**](https://www.gpg4win.org).

**Generate Key Pair**

Run: **gpg --full-generate-key**, select **RSA and RSA**, and a length of **4096**. Answer the remaining prompts as you prefer.

Note that the long string of characters on the line after **pub** is your key's "fingerprint". This is a unique "summary" of your public key which can be used to quickly ensure that the full key matches. It can be useful to make this available as I do below. You can find the fingerprint at any time with **gpg --fingerprint address@domain.com**.

**Share Your Public Key**

Export your public key from the **gnupg** keyring: **gpg --armor --export --output public.asc address@domain.com**

You can share this key with individuals whom you would like to be able to receive encrypted mail from. You should share the fingerprint alongside the **public.asc** file so that individuals will know that it is intact.

Even better, you can share your public key to a key server, most prominently [the OpenPGP server](https://keys.openpgp.org/upload/submit) where others can automatically discover it by searching for your email address.

**Secure Your Private Key**

Export your private key with: **gpg --armor --export-secret-keys --output private.asc address@domain.com**

Securely back up **private.asc**. Don't share it with anyone for any reason. If you do, you will need to revoke the certificate with: **gpg --output revoke.asc --gen-revoke address@domain.com** and distribute it to any person and/or key server that you have shared the now-compromised public key with.

Warning: If you lose your key, you will no longer be unable to unlock any encrypted messages.

**Email Me**

If you get stuck or would like to send a test email, you can send an encrypted message to me (even if your key is not set up to receive encrypted email yet).

1. Download [my key](https://mer.tz/gpg/mail.asc) or search for my address on [the OpenPGP key server](https://keys.openpgp.org/search?q=mail@john.me.tz)
2. Load the key into your mail application
3. Verify that the key matches: **1584 FC1D 9EDA FBB9 72FE AEF1 725C C625 C790 2FDC**
4. Compose a message and ensure that encryption is enabled

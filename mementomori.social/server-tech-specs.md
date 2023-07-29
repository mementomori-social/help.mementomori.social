---
description: >-
  Mementomori.social consists of many bits and pieces. This technical page is
  meant to tell you all about that.
---

# Server tech specs

## Software

I'm running the latest Mastodon nightly fork from [source](https://github.com/ronilaukkarinen/mastodon).

## Server infrastructure

This is where the magic happens.

### The main server

Mementomori.social is running on [Hetzner](https://www.hetzner.com/) Virtual Private Server, located in Helsinki, Finland. The server specifications:

* 8 vcpus
* 32 GB RAM
* 40 GB local disk
* 60 GB SSD volume for PostgreSQL database

Server software has

* Latest [nginx](https://www.nginx.com/)
* [Brotli](https://github.com/google/brotli)
* [Redis](https://redis.io/) and all the other cool Mastodon dependencies

### S3 Object storage for media

Media storage is provided by [Cloudflare R2, Zero Egress Distributed Object Storage](https://www.cloudflare.com/products/r2/).

## Tweaks

There are some extensive improvements to the default installation.

### Sidekiq services and jobs

Sidekiq background jobs have been separated to 12 systemd services. [I decided not to have them on a different server for now](https://mementomori.social/@rolle/110366892496594617), didn't find the benefit in it yet.

```bash
mastodon@mementomori:~$ sudo ls /etc/systemd/system/ |grep mastodon-sidekiq
mastodon-sidekiq-1-default@.service
mastodon-sidekiq-1-ingress@.service
mastodon-sidekiq-2-default@.service
mastodon-sidekiq-2-ingress@.service
mastodon-sidekiq-default@.service
mastodon-sidekiq-ingress@.service
mastodon-sidekiq-mailers@.service
mastodon-sidekiq-pull@.service
mastodon-sidekiq-push@.service
mastodon-sidekiq-scheduler@.service
mastodon-sidekiq.service
mastodon-sidekiq-template.service
```

Files (you get the idea):

{% tabs %}
{% tab title="mastodon-sidekiq-1-default@.service" %}
{% code title="mastodon-sidekiq-1-default@.service" %}
```systemd
[Unit]
Description=mastodon-sidekiq-%j-queue
After=network.target

[Service]
Type=simple
User=mastodon
WorkingDirectory=/home/mastodon/live
Environment="RAILS_ENV=production"
Environment="DB_POOL=%i"
Environment="MALLOC_ARENA_MAX=2"
Environment="LD_PRELOAD=libjemalloc.so"
ExecStart=/home/mastodon/.rbenv/shims/bundle exec sidekiq -c %i -q %j
TimeoutSec=15
Restart=always
# Proc filesystem
ProcSubset=pid
ProtectProc=invisible
# Capabilities
CapabilityBoundingSet=
# Security
NoNewPrivileges=true
# Sandboxing
ProtectSystem=strict
PrivateTmp=true
PrivateDevices=true
PrivateUsers=true
ProtectHostname=true
ProtectKernelLogs=true
ProtectKernelModules=true
ProtectKernelTunables=true
ProtectControlGroups=true
RestrictAddressFamilies=AF_INET
RestrictAddressFamilies=AF_INET6
RestrictAddressFamilies=AF_NETLINK
RestrictAddressFamilies=AF_UNIX
RestrictNamespaces=true
LockPersonality=true
RestrictRealtime=true
RestrictSUIDSGID=true
RemoveIPC=true
PrivateMounts=true
ProtectClock=true
# System Call Filtering
SystemCallArchitectures=native
SystemCallFilter=~@cpu-emulation @debug @keyring @ipc @mount @obsolete @privileged @setuid
SystemCallFilter=@chown
SystemCallFilter=pipe
SystemCallFilter=pipe2
ReadWritePaths=/home/mastodon/live

[Install]
WantedBy=multi-user.target
```
{% endcode %}
{% endtab %}
{% endtabs %}

### Crontabs

There are some periodically running jobs.

{% tabs %}
{% tab title="User: root" %}
```sh
# This is required for vixie-cron (man cron)
# Check http://superuser.com/questions/264528/problem-with-random-in-crontab/264541#264541
SHELL=/bin/bash

# Auto renew Let’s Encrypt certs, two times a day at a random minute.
# https://gist.github.com/ahmedelgabri/cba569863cfed73eeee2614d28a02004
0 */12 * * * /etc/bin/certbot-renew.sh >/dev/null 2>&1

# Disk space monitor
*/10 * * * * /etc/bin/diskspace.sh >/dev/null 2>&1
#*/30 * * * * /etc/bin/diskspace-media.sh >/dev/null 2>&1

# Check rclone mount health
* * * * * /usr/bin/rclone-directory-check.sh >/dev/null 2>&1

# Backup to gdrive
0 3 * * * bash /usr/bin/backup.sh >/dev/null 2>&1

# Prune rclone logs every night
5 4 * * * rm /var/log/rclone/*.log* >/dev/null 2>&1

# Database heartbeat
* * * * * bash /etc/bin/check-db.sh >/dev/null 2>&1

# Database size heartbeat
*/3 * * * * bash /etc/bin/diskspace-db.sh >/dev/null 2>&1

# Streaming API check
* * * * * bash /etc/bin/check-streaming.sh >/dev/null 2>&1
```
{% endtab %}

{% tab title="User: mastodon" %}
```sh
# Mastodon related
5 0 * * * RAILS_ENV=production /home/mastodon/.rbenv/shims/bundle exec rake mastodon:media:clear
10 0 * * * RAILS_ENV=production /home/mastodon/.rbenv/shims/bundle exec rake mastodon:push:refresh
15 0 * * * RAILS_ENV=production /home/mastodon/.rbenv/shims/bundle exec rake mastodon:feeds:clear

# Fetch new users
0 */4 * * * cd /home/mastodon/suomalaiset-mastodon-kayttajat && php /home/mastodon/suomalaiset-mastodon-kayttajat/fetch.php > /dev/null 2>&1

# Prune mastodon stuff to save disk space
0 */12 * * * bash /etc/bin/mastodon-prune.sh >/dev/null 2>&1

# Index search results periodically
0 */4 * * * bash /etc/bin/mastodon-build-search-index.sh >/dev/null 2>&1

# Check sidekiq health
* * * * * /bin/bash -l -c 'cd /home/mastodon/live && bash /etc/bin/check-sidekiq.sh' >/dev/null 2>&1

# Build ElasticSearch index
0 0 * * * /bin/bash -l -c 'cd /home/mastodon/live && bash /etc/bin/mastodon-build-search-index.sh' >/dev/null 2>&1
```
{% endtab %}
{% endtabs %}

### Server status and monitoring

The admin gets a phone call from Better Uptime automation if anything mentioned on the status page goes down, by the minute.

Services status can be followed at [status.mementomori.social](https://status.mementomori.social/). Status page, monitors and heart beats are provided by [Better Stack](https://betteruptime.com).

### Backups

* Snapshots from Hetzner every night (full server backed up)
* Cron scripts which backup everything to Hetzner Storage box and Google Drive (Enterprise, unlimited)
* Backups from database and files separately
* Manual backups each time anything is performed

---
description: This is the manual upgrade workflow for mementomori.social.
---

# Mastodon upgrade workflow

### Test on the development environment

**Start with logging in as the right user on your local Linux development environment.**

```bash
sudo su - mastodon
```

```bash
cd /opt/mastodon
```

> This branch is 45 commits behind mastodon/mastodon:main.

### Steps

1. Go to [GitHub](https://github.com/ronilaukkarinen/mastodon/tree/main)
2. Take note: "This branch is X commits behind mastodon/mastodon:main", add note to part above.
3. Sync fork with main
4. Fetch all changes:

```bash
git fetch --all
```

5. Checkout main, build and test:

```bash
yarn cache clean && git checkout main && git pull
```

```bash
# If needed, install whatever version is needed in this point
rbenv install 3.3.4
```

```bash
bundle install && yarn install && RAILS_ENV=production bundle exec rails assets:precompile
```

```bash
restart-mastodon
```

This is an alias for:

```bash
sudo systemctl restart mastodon-web mastodon-sidekiq mastodon-streaming && sleep 5 && sudo systemctl restart postgresql
```

6. Check migrations:

```bash
RAILS_ENV=production bundle exec rails db:migrate:status
```

7. Migrate:

```bash
RAILS_ENV=production bundle exec rails db:migrate
```

8. If needs manual migrations, add:

```bash
RAILS_ENV=production bundle exec rails db:migrate:up VERSION=20230724160715
```

9. After migrations you might need to clear cache before restart:

```bash
RAILS_ENV=production /opt/mastodon/bin/tootctl cache clear
```

10. Test:

* Does the audio notification work
* Does the emoji picker work
* Does everything seem normal
* Does the different feeds work (bookmarks, favs...)
* Does the toot edits work from the arrow [https://mementomori.test/@rolle/111668884903746596](https://mementomori.test/@rolle/111668884903746596)

11. Reset search index (on dev first: sudo service elasticsearch start):

```bash
RAILS_ENV=production bin/tootctl search deploy --reset-chewy
```

12. Rebuild search index:

```bash
RAILS_ENV=production bin/tootctl search deploy --only accounts --concurrency 16 --batch_size 4096;
RAILS_ENV=production bin/tootctl search deploy --only statuses --concurrency 16 --batch_size 4096;
```

13. Restart all services:

```bash
restart-mastodon
```

14. Create new branch for new version based on fresh main/tag:

```bash
git branch mementomods-2024-07-11
git checkout mementomods-2024-07-11
```

15. Attempt to merge previous branch:

```bash
git merge mementomods-2024-07-04
```

16. If it doesn't work with merge: Check the mods from last working branch, apply them on top of the branch and push the new working branch.
17. Update version:

```bash
nano +70 -w .env.production
```

18. Recompile:

```bash
bundle install && yarn install && RAILS_ENV=production bundle exec rails assets:precompile
```

```bash
restart-mastodon
```

19. It's good to clear cache sometimes:

```bash
RAILS_ENV=production /opt/mastodon/bin/tootctl cache clear
```

20. Start Elasticsearch on dev:

```bash
sudo service elasticsearch start
```

21. Reset search index (on dev first: sudo service elasticsearch start):

```bash
RAILS_ENV=production bin/tootctl search deploy --reset-chewy
```

22. If needed, build index for search:

```bash
RAILS_ENV=production bin/tootctl search deploy --only accounts --concurrency 16 --batch_size 4096;
RAILS_ENV=production bin/tootctl search deploy --only statuses --concurrency 16 --batch_size 4096;
```

23. Restart:

```bash
restart-mastodon
```

24. It's now time to test (If you see "Oops!An unexpected error occurred.", it is completely okay because we don't have access to the outside world.)
25. When everything works, push changes to git:

```bash
git push
```

26. Set upstream when asked.

### Install on production

1. When everything works properly, login to [mementomori.social](https://mementomori.social) on mastodon user.
2. Backup first:

```bash
sudo bash /usr/bin/backup-db.sh
```

3. Fetch changes:

```bash
cd $HOME/live
git fetch --all
git checkout -b upstream/mementomods-2024-07-11
git pull upstream mementomods-2024-07-11
```

4. Check that all changes are there:

```bash
git log --oneline
```

5. Update version:

```bash
nano -w +62 .env.production
```

6. Rebuild:

```bash
yarn cache clean
```

```bash
# If needed, install whatever version is needed in this point
rbenv install 3.3.4
```

```bash
bundle install && yarn install && RAILS_ENV=production bundle exec rails assets:precompile
```

7. Migrate:

```bash
RAILS_ENV=production bundle exec rails db:migrate:status
```

```bash
RAILS_ENV=production bundle exec rails db:migrate
```

8. Clear cache:

```bash
RAILS_ENV=production /home/mastodon/live/bin/tootctl cache clear
```

9. Run immediately:

```bash
sudo su -
/usr/local/bin/restart-mastodon
```

10. Open debug log:

```bash
sudo journalctl -u mastodon-web.service -f
```

11. Or monitor fatals:

```bash
sudo journalctl -u mastodon-web.service -f |grep FATAL
```

12. **Done!**

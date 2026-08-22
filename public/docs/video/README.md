# Product overview video

The landing page's **Watch Demo** button plays `overview.mp4` from this directory, served
at `https://loveheartbeat.com/docs/video/overview.mp4`.

## It is fetched, not committed

The file is ~53 MB. That does not belong in git — it would sit in every clone forever —
so `.gitignore` excludes it and the `video` Gulp task downloads it instead, from the Loom
share link, through the same public endpoint Loom's own share page uses.

`gulp build` runs that task before `build:static`, so `build/docs/video/overview.mp4`
exists on every build and the deploy uploads it.

**That ordering is not incidental.** The frontend deploy runs

    aws s3 sync build/ s3://<bucket>/ --delete

so anything missing from `build/` is *deleted from S3*. Uploading the video to the bucket
by hand would work exactly until the next deploy removed it. It has to come from the
build, which is what the task guarantees.

## Pointing it at a different recording

    OVERVIEW_LOOM_ID=<loom-session-id> npm run build

The id is the last path segment of the share URL.

## If the fetch fails

The build logs a warning and carries on — a missing video is not a reason to fail a
deploy. The landing page notices the missing source, hides the player, and offers the
Loom link instead, so the button still works.

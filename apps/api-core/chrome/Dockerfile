FROM ubuntu:bionic

ENV PORT=9222

RUN apt-get update && \
  apt-get install --no-install-recommends --yes \
  chromium-browser \
  ca-certificates \
  dumb-init

RUN apt-get clean

RUN groupadd chromium && \
  useradd --create-home --gid chromium chromium && \
  chown --recursive chromium:chromium /home/chromium/


COPY --chown=chromium:chromium entrypoint.sh /home/chromium/

USER chromium

ENTRYPOINT ["dumb-init", "--", "/bin/sh", "/home/chromium/entrypoint.sh"]
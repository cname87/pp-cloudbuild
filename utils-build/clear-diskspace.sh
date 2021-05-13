#!/bin/bash

# Run to try avoid low memory which prevents git running in cloudbuild
# Eventually will need to repartition

# Check free space on /dev/sda7
 df -Th

# Clean packages
sudo apt autoremove
sudo apt autoclean
sudo apt-get clean

# Docker is a huge consumer - images build up during development
# See https://www.digitalocean.com/community/tutorials/how-to-remove-docker-images-containers-and-volumes#:~:text=Remove%20all%20images,docker%20images%20%2Da
docker system prune -a


# Clean journal
journalctl --disk-usage
sudo journalctl --vacuum-time=3d

# Removes old revisions of snaps
# CLOSE ALL SNAPS BEFORE RUNNING THIS
sudo du -h /var/lib/snapd/snaps
set -eu
sudo snap list --all | awk '/disabled/{print $1, $3}' |
    while read snapname revision; do
        snap remove "$snapname" --revision="$revision"
    done

# Deletes home .cache directory
rm -rf ~/.cache/*

# NB: Empty the trash folder
cd ~/.local/share/Trash/
rm -rf

cd /var/lib/snapd/cache
sudo rm -rf

sudo rm -rf /tmp/*
sudo rm -rf /var/tmp/*

# Check free space on /dev/sda7
 df -Th

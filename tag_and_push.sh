#!/usr/bin/env bash
docker build -t sozluk-backup .
docker tag nginx:latest erayarslan/sozluk-backup:prod
docker push erayarslan/sozluk-backup:prod
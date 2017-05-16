#!/usr/bin/env bash
docker build -t sozluk-backup .
docker tag sozluk-backup:latest erayarslan/sozluk-backup:prod
docker push erayarslan/sozluk-backup:prod
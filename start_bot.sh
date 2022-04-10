#!/bin/bash


PYTHON_LEGACY_DATABASE=config/rss.db
PYTHON_LEGACY_DATABASE_BACKUP=config/backup_python_rss.db

JS_DATABASE=config/rss_bot_database.db

PRISMA=./node_modules/.bin/prisma

if test -f "$PYTHON_LEGACY_DATABASE"; then
    echo "INFO: Old database exists:$PYTHON_LEGACY_DATABASE, backing it up as backup_python_rss.db"
    
    cp $PYTHON_LEGACY_DATABASE $PYTHON_LEGACY_DATABASE_BACKUP
    
    sqlite3 $PYTHON_LEGACY_DATABASE < prisma/migrations/python_to_js_migration.sql
    
    mv $PYTHON_LEGACY_DATABASE $JS_DATABASE
    
    $PRISMA migrate resolve --applied init
    $PRISMA migrate dev
    
fi


$PRISMA migrate deploy

node --max_old_space_size=1024 dist/main.js
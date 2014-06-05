#!/bin/sh

tsc --target ES5 --sourcemap -w phaser.d.ts app/*.ts --out app.js

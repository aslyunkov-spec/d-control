@echo off
title D-Control Stop

taskkill /FI "WINDOWTITLE eq D-Control Django*" /F

exit
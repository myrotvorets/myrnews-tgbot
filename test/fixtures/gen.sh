#!/bin/sh

openssl req -new -newkey rsa:2048 -days 36500 -nodes -x509 -subj "/C=UA/ST=Kyiv/L=Kyiv/O=Myrotvorets/CN=example.test"  -keyout server.key -out server.crt

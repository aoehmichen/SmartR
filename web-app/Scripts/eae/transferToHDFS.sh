#!/usr/bin/env bash

# We copy the file to the Spark master
scp $1 centos@$3:/tmp/$2

# We remotly execute the hadoop put
pdsh -w ssh:centos@$3 "hadoop fs -put /tmp/$2"

# We clean up the remote temp file
pdsh -w ssh:centos@$3 "rm -rf /tmp/$2"

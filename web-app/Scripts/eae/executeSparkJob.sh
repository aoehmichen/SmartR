#!/usr/bin/env bash#We trigger the Spark Jobpdsh -w ssh:centos@$2 "spark-submit --py-files CrossValidation.zip --master yarn-cluster  --num-executors 2 --driver-memory 1024m  --executor-memory 512m   --executor-cores 1 $1 &"
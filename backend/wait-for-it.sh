#!/bin/bash
# wait-for-it.sh

TIMEOUT=15
QUIET=0

WAITFORIT_HOST="$1"
WAITFORIT_PORT="$2"
shift 2

usage() {
  cat << USAGE >&2
Usage:
  $cmdname host:port [-t timeout] [-- command args]
  -t TIMEOUT                  Timeout in seconds, zero for no timeout
  -- COMMAND ARGS             Execute command with args after the test finishes
USAGE
  exit 1
}

wait_for() {
  echo "Waiting for $WAITFORIT_HOST:$WAITFORIT_PORT..."
  start_ts=$(date +%s)
  while :
  do
    (echo > /dev/tcp/$WAITFORIT_HOST/$WAITFORIT_PORT) >/dev/null 2>&1
    result=$?
    if [[ $result -eq 0 ]]; then
      end_ts=$(date +%s)
      echo "Service $WAITFORIT_HOST:$WAITFORIT_PORT is available after $((end_ts - start_ts)) seconds"
      break
    fi
    sleep 1
  done
  return $result
}

wait_for
WAITFORIT_RESULT=$?

if [[ $WAITFORIT_RESULT -ne 0 ]]; then
  echo "Failed to wait for $WAITFORIT_HOST:$WAITFORIT_PORT"
  exit $WAITFORIT_RESULT
fi

shift
exec "$@" 
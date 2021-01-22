microkit
========

Microservices toolkit

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/microkit.svg)](https://npmjs.org/package/microkit)
[![Downloads/week](https://img.shields.io/npm/dw/microkit.svg)](https://npmjs.org/package/microkit)
[![License](https://img.shields.io/npm/l/microkit.svg)](https://github.com/oleoneto/microkit/blob/master/package.json)

<!-- toc -->
* [Usage](#usage)
* [Commands](#commands)
<!-- tocstop -->
# Usage
<!-- usage -->
```sh-session
$ npm install -g @oleoneto/microkit
$ microkit COMMAND
running command...
$ microkit (-v|--version|version)
@oleoneto/microkit/0.2.5 darwin-x64 node-v12.20.1
$ microkit --help [COMMAND]
USAGE
  $ microkit COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`microkit help [COMMAND]`](#microkit-help-command)
* [`microkit utils`](#microkit-utils)
* [`microkit utils:audio:info PATH`](#microkit-utilsaudioinfo-path)
* [`microkit utils:call DIALSTRING`](#microkit-utilscall-dialstring)
* [`microkit utils:db`](#microkit-utilsdb)
* [`microkit utils:db:read`](#microkit-utilsdbread)
* [`microkit utils:kafka`](#microkit-utilskafka)
* [`microkit utils:kafka:listen`](#microkit-utilskafkalisten)
* [`microkit utils:kafka:produce`](#microkit-utilskafkaproduce)
* [`microkit utils:rtmp`](#microkit-utilsrtmp)
* [`microkit utils:rtp`](#microkit-utilsrtp)
* [`microkit utils:s3`](#microkit-utilss3)
* [`microkit utils:s3:download KEY`](#microkit-utilss3download-key)

## `microkit help [COMMAND]`

display help for microkit

```
USAGE
  $ microkit help [COMMAND]

ARGUMENTS
  COMMAND  command to show help for

OPTIONS
  --all  see all commands in CLI
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v2.2.3/src/commands/help.ts)_

## `microkit utils`

developer utilities

```
USAGE
  $ microkit utils
```

_See code: [src/commands/utils/index.ts](https://github.com/oleoneto/microkit/blob/v0.2.5/src/commands/utils/index.ts)_

## `microkit utils:audio:info PATH`

check the information of an audio file

```
USAGE
  $ microkit utils:audio:info PATH

OPTIONS
  -x, --extended          show extra columns
  --columns=columns       only show provided columns (comma-separated)
  --csv                   output is csv format [alias: --output=csv]
  --filter=filter         filter property by partial string matching, ex: name=foo
  --no-header             hide table header from output
  --no-truncate           do not truncate output to fit screen
  --output=csv|json|yaml  output in a more machine friendly format
  --sort=sort             property to sort by (prepend '-' for descending)
```

_See code: [src/commands/utils/audio/info.ts](https://github.com/oleoneto/microkit/blob/v0.2.5/src/commands/utils/audio/info.ts)_

## `microkit utils:call DIALSTRING`

place a call using an asterisk server

```
USAGE
  $ microkit utils:call DIALSTRING

OPTIONS
  -a, --address=address                          (required) [default: http://127.0.0.1:8088] asterisk server address
  -e, --external-media-host=external-media-host  RTP listening server address (external host)
  -f, --format=(ulaw|slin16)                     [default: ulaw] audio format
  -m, --mode=mode                                [default: SIP] mode
  -p, --password=password                        (required) [default: asterisk] asterisk password
  -u, --username=username                        (required) [default: asterisk] asterisk user
  --docker                                       set this if asterisk server is running inside a docker container
  --enable-external-media                        enable external media [asterisk 16+]

EXAMPLES
  $ microkit utils:call 6001
  $ microkit utils:call 6001 --mode SIP
  $ microkit utils:call 6001 --mode=SIP --address=http://127.0.0.1:8088 --username=asterisk
  $ microkit utils:call 6001 --enable-external_media --docker
  $ microkit utils:call 6001 --enable-external-media --external-media-host=http://localhost:5554
  $ microkit utils:call 6001 --enable-external-media --external-media-host=http://localhost:5554 -f=slin16
```

_See code: [src/commands/utils/call/index.ts](https://github.com/oleoneto/microkit/blob/v0.2.5/src/commands/utils/call/index.ts)_

## `microkit utils:db`

interact with SQL databases (only Postgres supported)

```
USAGE
  $ microkit utils:db
```

_See code: [src/commands/utils/db/index.ts](https://github.com/oleoneto/microkit/blob/v0.2.5/src/commands/utils/db/index.ts)_

## `microkit utils:db:read`

read from a database table

```
USAGE
  $ microkit utils:db:read

OPTIONS
  -x, --extended               show extra columns
  --columns=columns            only show provided columns (comma-separated)
  --csv                        output is csv format [alias: --output=csv]
  --database=database          database name
  --database-url=database-url  database url
  --filter=filter              filter property by partial string matching, ex: name=foo
  --limit=limit                [default: 100] sql select limit
  --no-header                  hide table header from output
  --no-truncate                do not truncate output to fit screen
  --offset=offset              sql select offset
  --output=csv|json|yaml       output in a more machine friendly format
  --sort=sort                  property to sort by (prepend '-' for descending)
  --table=table                (required) database table

EXAMPLES
  $ microkit db:read --table friends
  $ microkit db:read --table friends --database people
  $ microkit db:read --table friends --limit 2
  $ microkit db:read --table friends --limit 10 --offset 2
```

_See code: [src/commands/utils/db/read.ts](https://github.com/oleoneto/microkit/blob/v0.2.5/src/commands/utils/db/read.ts)_

## `microkit utils:kafka`

produce and/or consume kafka messages

```
USAGE
  $ microkit utils:kafka
```

_See code: [src/commands/utils/kafka/index.ts](https://github.com/oleoneto/microkit/blob/v0.2.5/src/commands/utils/kafka/index.ts)_

## `microkit utils:kafka:listen`

listen for or consume Kafka events

```
USAGE
  $ microkit utils:kafka:listen

OPTIONS
  -g, --groupId=groupId  [default: microkit] kafka consumer group identifier
  -t, --topics=topics    (required) kafka topic
  --host=host            address of kafka host [i.e. https://example.com:9094]
  --keys=keys            kafka keys to watch for
  --listen-once          stop listening once a message is received
  --mode=(watch|ignore)  determine whether to care about or ignore these keys
  --total=total          maximum number of messages to consume

EXAMPLES
  $ microkit utils:kafka:listen --topics feed
  $ microkit utils:kafka:listen --topics feed registrations
  $ microkit utils:kafka:listen --topics feed --listen-once
  $ microkit utils:kafka:listen --topics feed --actions like comment --mode watch
  $ microkit utils:kafka:listen --topics feed --actions repost --mode --ignore
```

_See code: [src/commands/utils/kafka/listen.ts](https://github.com/oleoneto/microkit/blob/v0.2.5/src/commands/utils/kafka/listen.ts)_

## `microkit utils:kafka:produce`

produce kafka messages

```
USAGE
  $ microkit utils:kafka:produce

OPTIONS
  -a, --action=action  kafka topic action
  -o, --object=object  (required) [default: {"origin": "microkit"}] payload in JSON format
  -t, --topic=topic    (required) kafka topic
  --host=host          address of kafka host [i.e. https://example.com:9094]
  --total=total        [default: 1] number of messages to send

EXAMPLES
  $ microkit utils:kafka:produce --topic feed
  $ microkit utils:kafka:produce --topic feed --total 10
  $ microkit utils:kafka:produce --topic feed --object '{"userId": 8897, "action": "like", "objectId": 42}'
```

_See code: [src/commands/utils/kafka/produce.ts](https://github.com/oleoneto/microkit/blob/v0.2.5/src/commands/utils/kafka/produce.ts)_

## `microkit utils:rtmp`

starts an RTMP server (video streaming)

```
USAGE
  $ microkit utils:rtmp

OPTIONS
  --chunk-size=chunk-size      [default: 60000] RTMP server chunk size
  --gop-cache                  RTMP server cache
  --http-port=http-port        [default: 9700] HTTP port [affects playback and admin dashboard]
  --ping=ping                  [default: 30] RTMP server ping
  --ping-timeout=ping-timeout  [default: 60] RTMP server ping-timeout in seconds
  --port=port                  [default: 1935] RTMP server port
  --record                     capture/record RTMP stream into a file
  --recording-format=(mkv)     [default: mkv] recording format
  --source-encoding=(flv)      [default: flv] RTMP video source encoding

EXAMPLES
  $ microkit utils:rtmp
  $ microkit utils:rtmp --port=1935 --http-port=8090
  $ microkit utils:rtmp --record --recording-format=mkv
```

_See code: [src/commands/utils/rtmp/index.ts](https://github.com/oleoneto/microkit/blob/v0.2.5/src/commands/utils/rtmp/index.ts)_

## `microkit utils:rtp`

starts an RTP server

```
USAGE
  $ microkit utils:rtp

OPTIONS
  -e, --engine=(aws|deepgram)  transcriber engine
  -p, --port=port              [default: 5554] RTP client port
  -t, --transcribe             enables audio transcription of RTP traffic
  --log                        log RTP server messages
  --show-info                  show RTP packet info
  --show-packets               show RTP packets

EXAMPLES
  $ microkit utils:rtp
  $ microkit utils:rtp --port 5554
  $ microkit utils:rtp --show-packets=true
```

_See code: [src/commands/utils/rtp/index.ts](https://github.com/oleoneto/microkit/blob/v0.2.5/src/commands/utils/rtp/index.ts)_

## `microkit utils:s3`

interact with S3 buckets

```
USAGE
  $ microkit utils:s3
```

_See code: [src/commands/utils/s3/index.ts](https://github.com/oleoneto/microkit/blob/v0.2.5/src/commands/utils/s3/index.ts)_

## `microkit utils:s3:download KEY`

download file from S3 bucket

```
USAGE
  $ microkit utils:s3:download KEY

OPTIONS
  -b, --bucket=bucket                      (required) name of S3 bucket
  -l, --downloadLocation=downloadLocation  path where the downloads should be saved

EXAMPLES
  $ microkit utils:s3:download audio.mp3 --bucket my-photos
  $ microkit utils:s3:download audio.mp3 --bucket my-photos -l ~/Downloads
```

_See code: [src/commands/utils/s3/download.ts](https://github.com/oleoneto/microkit/blob/v0.2.5/src/commands/utils/s3/download.ts)_
<!-- commandsstop -->
* [`microkit help [COMMAND]`](#microkit-help-command)

## `microkit help [COMMAND]`

display help for microkit

```
USAGE
  $ microkit help [COMMAND]

ARGUMENTS
  COMMAND  command to show help for

OPTIONS
  --all  see all commands in CLI
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v2.2.3/src/commands/help.ts)_

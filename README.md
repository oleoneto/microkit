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
@oleoneto/microkit/0.2.1 darwin-x64 node-v12.18.4
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
* [`microkit utils:call DIALSTRING`](#microkit-utilscall-dialstring)
* [`microkit utils:db`](#microkit-utilsdb)
* [`microkit utils:db:read`](#microkit-utilsdbread)
* [`microkit utils:kafka`](#microkit-utilskafka)
* [`microkit utils:kafka:listen`](#microkit-utilskafkalisten)
* [`microkit utils:kafka:produce`](#microkit-utilskafkaproduce)
* [`microkit utils:rtp`](#microkit-utilsrtp)
* [`microkit utils:s3`](#microkit-utilss3)
* [`microkit utils:s3:download KEY`](#microkit-utilss3download-key)
* [`microkit utils:transcribe`](#microkit-utilstranscribe)

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

_See code: [src/commands/utils/index.ts](https://github.com/oleoneto/microkit/blob/v0.2.1/src/commands/utils/index.ts)_

## `microkit utils:call DIALSTRING`

place a call using an asterisk server

```
USAGE
  $ microkit utils:call DIALSTRING

OPTIONS
  -a, --address=address                      [default: http://127.0.0.1:8088] asterisk server address
  -e, --externalMediaHost=externalMediaHost  [default: localhost:5554] RTP listening server address (external host)
  -f, --format=format                        [default: ulaw] audio format
  -m, --mode=mode                            [default: SIP] mode
  -p, --password=password                    [default: asterisk] asterisk password
  -t, --transcribe                           transcribe call in real-time
  -u, --username=username                    [default: asterisk] asterisk user
  --docker                                   indicate whether asterisk server is running within a docker container

EXAMPLES
  $ microkit utils:call 6001
  $ microkit utils:call 6001 --mode SIP
  $ microkit utils:call 6001 --transcribe
  $ microkit utils:call 6001 --transcribe -e localhost:5554
  $ microkit utils:call 6001 --transcribe -a http://127.0.0.1:8088 -u asterisk --docker
```

_See code: [src/commands/utils/call/index.ts](https://github.com/oleoneto/microkit/blob/v0.2.1/src/commands/utils/call/index.ts)_

## `microkit utils:db`

interact with SQL databases (only Postgres supported)

```
USAGE
  $ microkit utils:db
```

_See code: [src/commands/utils/db/index.ts](https://github.com/oleoneto/microkit/blob/v0.2.1/src/commands/utils/db/index.ts)_

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

_See code: [src/commands/utils/db/read.ts](https://github.com/oleoneto/microkit/blob/v0.2.1/src/commands/utils/db/read.ts)_

## `microkit utils:kafka`

produce and/or consume kafka messages

```
USAGE
  $ microkit utils:kafka
```

_See code: [src/commands/utils/kafka/index.ts](https://github.com/oleoneto/microkit/blob/v0.2.1/src/commands/utils/kafka/index.ts)_

## `microkit utils:kafka:listen`

listen for or consume Kafka events

```
USAGE
  $ microkit utils:kafka:listen

OPTIONS
  -g, --groupId=groupId  [default: microkit] kafka consumer group identifier
  -t, --topics=topics    (required) kafka topic
  --actions=actions      kafka actions to watch
  --host=host            address of kafka host [i.e. https://example.com:9094]
  --listen-once          stop listening once a message is received
  --mode=(watch|ignore)  determine whether to care about or ignore the actions
  --total=total          maximum number of messages to consume

EXAMPLES
  $ microkit utils:kafka:listen --topics feed
  $ microkit utils:kafka:listen --topics feed registrations
  $ microkit utils:kafka:listen --topics feed --listen-once
  $ microkit utils:kafka:listen --topics feed --actions like comment --mode watch
  $ microkit utils:kafka:listen --topics feed --actions repost --mode --ignore
```

_See code: [src/commands/utils/kafka/listen.ts](https://github.com/oleoneto/microkit/blob/v0.2.1/src/commands/utils/kafka/listen.ts)_

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

_See code: [src/commands/utils/kafka/produce.ts](https://github.com/oleoneto/microkit/blob/v0.2.1/src/commands/utils/kafka/produce.ts)_

## `microkit utils:rtp`

starts an RTP server

```
USAGE
  $ microkit utils:rtp

OPTIONS
  --host=host  [default: 127.0.0.1] RTP server host
  --log        log RTP server messages
  --port=port  [default: 5554] RTP client port

EXAMPLES
  $ microkit utils:rtp
  $ microkit utils:rtp --host localhost --port 5554
  $ microkit utils:rtp --host localhost
  $ microkit utils:rtp --port 5554
```

_See code: [src/commands/utils/rtp/index.ts](https://github.com/oleoneto/microkit/blob/v0.2.1/src/commands/utils/rtp/index.ts)_

## `microkit utils:s3`

interact with S3 buckets

```
USAGE
  $ microkit utils:s3
```

_See code: [src/commands/utils/s3/index.ts](https://github.com/oleoneto/microkit/blob/v0.2.1/src/commands/utils/s3/index.ts)_

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

_See code: [src/commands/utils/s3/download.ts](https://github.com/oleoneto/microkit/blob/v0.2.1/src/commands/utils/s3/download.ts)_

## `microkit utils:transcribe`

transcribe an audio stream

```
USAGE
  $ microkit utils:transcribe

OPTIONS
  -p, --port=port          [default: 5554] RTP client port
  -v, --vendor=(deepgram)  [default: deepgram] transcription vendor
  --host=host              [default: 127.0.0.1] RTP server host

EXAMPLES
  $ microkit utils:transcribe
  $ microkit utils:transcribe --host localhost --port 5554
  $ microkit utils:transcribe --host localhost
  $ microkit utils:transcribe --port 5554
```

_See code: [src/commands/utils/transcribe/index.ts](https://github.com/oleoneto/microkit/blob/v0.2.1/src/commands/utils/transcribe/index.ts)_
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

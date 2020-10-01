export const structure = [
  {name: 'README.md', type: 'file'},
  {name: 'package.json', type: 'file'},
  {
    name: 'bin', type: 'directory', children: [
      {
        name: 'lib', type: 'directory', children: [
          {name: 'colorize.sh', type: 'file'},
        ],
      },
      {name: 'pre-commit.sh', type: 'file'},
      {name: 'pre-push.sh', type: 'file'},
    ],
  },
  {name: 'coverage', type: 'directory', children: []},
  {name: 'docker', type: 'directory', children: []},
  {name: 'docs', type: 'directory', children: []},
  {name: 'prisma', type: 'directory', children: []},
  {name: 'scripts', type: 'directory', children: []},
  {name: 'src', type: 'directory', children: []},
  {
    name: 'test', type: 'directory', children: [
      {name: 'clients', type: 'directory', children: []},
      {name: 'integrations', type: 'directory', children: []},
      {name: 'mocks', type: 'directory', children: []},
      {
        name: 'unit', type: 'directory', children: [
          {name: 'controllers', type: 'directory', children: []},
          {name: 'helpers', type: 'directory', children: []},
          {name: 'store', type: 'directory', children: []},
        ],
      },
    ],
  },
]

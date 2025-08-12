# Quick Pointer

A real-time collaborative story pointing tool for agile teams. No login required, just share your browser URL.

🚀 **Try it now:** [quickpointer.dinnerbell.design](https://quickpointer.dinnerbell.design)

## Features

- **Real-time collaboration** - All participants see votes and changes instantly
- **Anonymous voting** - Keep estimates unbiased
- **Fibonacci sequence** - Standard story point values (1, 2, 3, 5, 8, 13)
- **Jira integration** - Paste ticket URLs for quick reference
- **Zero setup** - No accounts, no configuration

## Tech Stack

- Ruby on Rails 8
- Turbo Streams & ActionCable for real-time updates
- Tailwind CSS
- Deployed with Kamal

## Local Development

```bash
# Install dependencies
bundle install

# Start the server
bin/rails server
```

Visit http://localhost:3000

## Deployment

This app is deployed using [Kamal](https://kamal-deploy.org/). Configuration in `config/deploy.yml`.

## License

MIT
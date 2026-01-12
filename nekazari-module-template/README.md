# NKZ Module Template

**Quick Start Template** for creating NKZ Platform (Nekazari) modules.

Get your module running in 5 minutes! 🚀

## Quick Start

```bash
# Clone this template
git clone https://github.com/k8-benetis/nkz-module-template.git my-module
cd my-module

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## What's Included

- ✅ Complete "Hello World" example
- ✅ **SDK packages from NPM** (`@nekazari/sdk`, `@nekazari/ui-kit`)
- ✅ All dependencies pre-configured
- ✅ TypeScript setup with full type support
- ✅ Tailwind CSS configured
- ✅ Vite proxy for API calls (development)
- ✅ Module Federation configured
- ✅ Real SDK usage (no mocks needed!)

## Customization

1. **Update `manifest.json`**:
   - Change `id`, `name`, `display_name`
   - Update `author` information
   - Set `route_path` and `label`

2. **Customize `src/App.tsx`**:
   - Replace Hello World content with your module
   - Use NKZ SDK: `import { NKZClient, useAuth, useTranslation } from '@nekazari/sdk'`
   - Use UI-Kit components: `import { Button, Card } from '@nekazari/ui-kit'`
   - All packages are installed from NPM - no configuration needed!

3. **Add your assets**:
   - Create `assets/icon.png` (128x128px)
   - Add screenshots to `assets/`

4. **Build and package**:
   ```bash
   npm run build
   zip -r my-module-v1.0.0.zip manifest.json package.json vite.config.ts src/ assets/ dist/
   ```

## Documentation

### Quick Start
- **[Quick Reference](./docs/QUICK_REFERENCE.md)** - Common tasks and code snippets
- **[Testing Guide](./docs/TESTING_GUIDE.md)** - How to test your module locally

### Complete Guides
- **[External Developer Guide](https://github.com/k8-benetis/nekazari-public/blob/main/docs/development/EXTERNAL_DEVELOPER_GUIDE.md)** - Complete SDK reference, UI components, upload process
- **[API Documentation](https://github.com/k8-benetis/nekazari-public/blob/main/docs/api/README.md)** - Available endpoints and data models

### Examples
- **[Examples Directory](./examples/)** - Code examples for common patterns
  - Entity List - Fetch and display entities
  - More examples coming soon

## Support

- **Email**: developers@nekazari.com
- **Documentation**: [Developer Guide](https://github.com/k8-benetis/nekazari-public/blob/main/docs/EXTERNAL_DEVELOPER_GUIDE.md)

---

**Happy Coding!** 🎉

## SDK Packages

This template uses the **publicly available** SDK packages from NPM:

- **`@nekazari/sdk`** - API client, authentication, i18n
- **`@nekazari/ui-kit`** - UI components (Button, Card, Input, etc.)

Both packages are licensed under **Apache-2.0**, allowing you to build proprietary/commercial modules.

**Installation**: Automatically installed via `npm install` (no additional setup needed)

**NPM Links**:
- SDK: https://www.npmjs.com/package/@nekazari/sdk
- UI-Kit: https://www.npmjs.com/package/@nekazari/ui-kit

---

> **Branding Note:** Packages are published under the `@nekazari` organization on NPM. "Nekazari" is the official platform name.

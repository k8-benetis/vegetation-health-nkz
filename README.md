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
- ✅ All dependencies pre-configured
- ✅ TypeScript setup
- ✅ Tailwind CSS configured
- ✅ Vite proxy for API calls (development)
- ✅ Module Federation configured
- ✅ Type definitions for SDK

## Customization

1. **Update `manifest.json`**:
   - Change `id`, `name`, `display_name`
   - Update `author` information
   - Set `route_path` and `label`

2. **Customize `src/App.tsx`**:
   - Replace Hello World content with your module
   - Use NKZ SDK for API calls (available at runtime)
   - Use UI-Kit components for consistent styling

3. **Add your assets**:
   - Create `assets/icon.png` (128x128px)
   - Add screenshots to `assets/`

4. **Build and package**:
   ```bash
   npm run build
   zip -r my-module-v1.0.0.zip manifest.json package.json vite.config.ts src/ assets/ dist/
   ```

## Documentation

See the complete [External Developer Guide](https://github.com/k8-benetis/nekazari-public/blob/main/docs/EXTERNAL_DEVELOPER_GUIDE.md) for:
- Complete SDK reference
- UI component documentation
- Upload and validation process
- Best practices

## Support

- **Email**: developers@nekazari.com
- **Documentation**: [Developer Guide](https://github.com/k8-benetis/nekazari-public/blob/main/docs/EXTERNAL_DEVELOPER_GUIDE.md)

---

**Happy Coding!** 🎉

> **Branding Note:** "NKZ" is the technical brand used in code and package names. "Nekazari" is the official platform name.

import React from 'react';
import ReactDOM from 'react-dom/client';
import VegetationLayerControl from '../components/slots/VegetationLayerControl';

class VegetationLayerControlElement extends HTMLElement {
  mountPoint: HTMLDivElement;
  root: ReactDOM.Root | null = null;

  constructor() {
    super();
    this.mountPoint = document.createElement('div');
  }

  connectedCallback() {
    this.appendChild(this.mountPoint);
    this.render();
  }

  disconnectedCallback() {
    if (this.root) {
      this.root.unmount();
    }
  }

  render() {
    if (!this.root) {
      this.root = ReactDOM.createRoot(this.mountPoint);
    }

    this.root.render(
      <React.StrictMode>
        <VegetationLayerControl />
      </React.StrictMode>
    );
  }
}

customElements.define('vegetation-layer-control', VegetationLayerControlElement);

export { VegetationLayerControl };

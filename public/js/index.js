import React from 'react';
import { render } from 'react-dom';
import App from '../../components/App';
import { library } from '@fortawesome/fontawesome-svg-core';
import { fas } from '@fortawesome/free-solid-svg-icons';

// Initialize Font Awesome
library.add(fas);

// Render the app
render(<App />, document.getElementById('root'));

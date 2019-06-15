import React from 'react';
import ReactDOM from 'react-dom';
import { create } from 'jss';
import { StylesProvider, jssPreset } from '@material-ui/styles';
import './index.css';
import App from './App';

const jss = create({
    ...jssPreset(),
    insertionPoint: 'jss-insertion-point',
});

ReactDOM.render(
    <StylesProvider jss={ jss }>
        <App />
    </StylesProvider>,
    document.getElementById('root')
);

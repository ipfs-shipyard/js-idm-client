import React, { Component, Fragment } from 'react';
import createIdmClient from 'idm-client';
import { createClientSide } from 'idm-bridge-postmsg';
import { PromiseState } from 'react-promiseful';
import AuthBar from './components/auth-bar';
import SignData from './components/sign-data';
import './App.css';

const WALLET_URL = 'http://localhost:3000';
const APP = {
    name: 'IDM Client demo app',
    homepageUrl: window.location.origin,
    iconUrl: `${window.location.href}favicon.ico`,
};

class App extends Component {
    state = {
        promise: createClientSide(WALLET_URL).then((bridge) => createIdmClient(APP, bridge)),
    };

    render() {
        return (
            <div className="App">
                <PromiseState promise={ this.state.promise }>
                    { ({ status, value }) => {
                        switch (status) {
                        case 'pending': return <div className="App-loading">Loading...</div>;
                        case 'rejected': return <div className="App-error">{ value.message }</div>;
                        case 'fulfilled': return this.renderContent(value);
                        default: return null;
                        }
                    } }
                </PromiseState>
            </div>
        );
    }

    renderContent(idmClient) {
        return (
            <Fragment>
                <AuthBar idmClient={ idmClient } />
                <SignData idmClient={ idmClient } />
            </Fragment>
        );
    }
}

export default App;

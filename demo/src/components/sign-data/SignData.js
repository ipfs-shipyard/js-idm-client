import React, { Component, createRef } from 'react';
import PropTypes from 'prop-types';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import './SignData.css';

class SignData extends Component {
    removeOnSessionChange = undefined;
    inputRef = createRef();

    state = {
        authenticated: false,
        data: '',
        signature: undefined,
        error: undefined,
    };

    constructor(props) {
        super(props);

        this.state.authenticated = props.idmClient.isAuthenticated();
    }

    componentDidMount() {
        this.removeOnSessionChange = this.props.idmClient.onSessionChange(this.handleSessionChange);
    }

    componentWillUnmount() {
        this.removeOnSessionChange();
    }

    render() {
        const { authenticated, data, signature, error } = this.state;

        return (
            <div className="SignData">
                <TextField
                    label="Data to sign"
                    value={ data }
                    disabled={ !authenticated }
                    onChange={ this.handleInputChange }
                    margin="normal"
                    fullWidth />

                <div className="SignData-buttons">
                    <Button
                        variant="outlined"
                        disabled={ !authenticated || !data }
                        className="SignData-button"
                        onClick={ this.handleSignWithSessionClick }>
                        Sign with session
                    </Button>

                    <Button
                        variant="outlined"
                        color="primary"
                        disabled={ !authenticated || !data }
                        className="SignData-button"
                        onClick={ this.handleSignWithDeviceClick }>
                        Sign with device
                    </Button>
                </div>

                { signature && <pre className="SignData-signature"><code>{ signature }</code></pre> }
                { error && <div className="SignData-error">{ error.message }</div> }
            </div>
        );
    }

    handleSessionChange = () => {
        this.setState((state) => {
            const authenticated = this.props.idmClient.isAuthenticated();

            return {
                authenticated,
                error: authenticated ? state.error : undefined,
                signature: authenticated ? state.signature : undefined,
            };
        });
    };

    handleInputChange = (event) => this.setState({
        data: event.target.value,
        signature: undefined,
        error: undefined,
    });

    handleSignWithSessionClick = () => this.handleSignClick('session');

    handleSignWithDeviceClick = () => this.handleSignClick('device');

    handleSignClick = async (signWith) => {
        this.setState({
            signature: undefined,
            error: undefined,
        });

        let signature;

        try {
            signature = await this.props.idmClient.sign(this.state.data, { signWith });
        } catch (error) {
            return this.setState({
                signature: undefined,
                error,
            });
        }

        console.log('Signature:', signature);
        console.log('Signature ok!');

        return this.setState({
            data: '',
            signature: JSON.stringify(signature, null, 2),
            error: undefined,
        });
    };
}

SignData.propTypes = {
    idmClient: PropTypes.object.isRequired,
};

export default SignData;

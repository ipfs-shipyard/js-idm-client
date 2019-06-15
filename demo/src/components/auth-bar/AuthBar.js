import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Avatar from '@material-ui/core/Avatar';
import Button from '@material-ui/core/Button';
import './AuthBar.css';

class AuthBar extends Component {
    removeOnSessionChange = undefined;

    state = {
        profileDetails: undefined,
        error: undefined,
    };

    constructor(props) {
        super(props);

        if (props.idmClient.isAuthenticated()) {
            this.state.profileDetails = props.idmClient.getSession().profileDetails;
        }
    }

    componentDidMount() {
        this.removeOnSessionChange = this.props.idmClient.onSessionChange(this.handleSessionChange);
    }

    componentWillUnmount() {
        this.removeOnSessionChange();
    }

    render() {
        const { profileDetails, error } = this.state;

        return (
            <div className="AuthBar">
                { error && <span className="AuthBar-error">{ error.message }</span> }
                { profileDetails ? this.renderAuthenticated() : this.renderNotAuthenticated() }
            </div>
        );
    }

    renderAuthenticated() {
        const { profileDetails } = this.state;

        return (
            <div className="AuthBar-authenticated">
                <Avatar src={ profileDetails.image } className="AuthBar-avatar">
                    { profileDetails.name && profileDetails.name.substr(0, 1) }
                </Avatar>

                <div className="AuthBar-name">{ profileDetails.name || 'Nameless' }</div>

                <Button
                    variant="contained"
                    color="secondary"
                    className="AuthBar-button"
                    onClick={ this.handleLogoutClick }>
                    Logout
                </Button>
            </div>
        );
    }

    renderNotAuthenticated() {
        return (
            <Button
                variant="contained"
                color="primary"
                className="AuthBar-button"
                onClick={ this.handleLoginClick }>
                Login with IDM
            </Button>
        );
    }

    handleSessionChange = (session) => {
        this.setState({
            profileDetails: session && session.profileDetails,
            error: undefined,
        });
    };

    handleLoginClick = async () => {
        this.setState({ error: undefined });

        let session;

        try {
            session = await this.props.idmClient.authenticate();
        } catch (error) {
            return this.setState({ error });
        }

        console.log('Session:', session);
    };

    handleLogoutClick = async () => {
        this.setState({ error: undefined });

        try {
            await this.props.idmClient.unauthenticate();
        } catch (error) {
            return this.setState({ error });
        }
    };
}

AuthBar.propTypes = {
    idmClient: PropTypes.object.isRequired,
};

export default AuthBar;

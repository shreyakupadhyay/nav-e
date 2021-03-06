import React, { Component, PropTypes } from 'react';
import AutoComplete from 'material-ui/AutoComplete';
import Slider from 'material-ui/Slider';
import RaisedButton from 'material-ui/RaisedButton';
import FontIcon from 'material-ui/FontIcon';
import SelectField from 'material-ui/SelectField';
import MenuItem from 'material-ui/MenuItem';
import TextField from 'material-ui/TextField';
import { green700 } from 'material-ui/styles/colors';
import config from '../config';

const styles = {
  menu: {
    margin: '10px 20px 30px'
  },

  reachabilitySlider: {
    marginBottom: '0px'
  },

  batteryLevel: {
    display: 'flex',
    justifyContent: 'space-between'
  },

  batteryLevelValue: {
    fontWeight: 'bold',
    color: green700,
    fontSize: '14px'
  },

  autoCompleteWrapper: {
    position: 'relative',
    display: 'flex'
  },

  rangeTextField: {
    display: 'inherit',
    position: 'relative',
    marginBottom: '25px'
  },

  buttonDiv: {
    display: 'flex',
  },

  displayButton: {
    marginRight: '18px'
  }
};

export default class ReachabilityTab extends Component {
  constructor(props) {
    super(props);
    this.state = {
      dataSource: [],
    };

    window.google.load('maps', '3', {
      other_params: `key=${config.GOOGLE_MAP_KEY}&libraries=places`
    });
    window.google.setOnLoadCallback(this.initialize);
  }

  getCoordinateFromPlaceId = id => new Promise((resolve) => {
    this.state.placesService.getDetails({ placeId: id }, (results, status) => {
      if (status === window.google.maps.places.PlacesServiceStatus.OK) {
        resolve([results.geometry.location.lng(), results.geometry.location.lat()]);
      }
    });
  })

  initialize = () => {
    const map = new window.google.maps.Map(document.getElementById('gmap'));
    this.setState({
      autocompleteService: new window.google.maps.places.AutocompleteService(),
      placesService: new window.google.maps.places.PlacesService(map),
    });
  }

  handleToRequest = (chosenRequest) => {
    if (chosenRequest.value) {
      this.getCoordinateFromPlaceId(chosenRequest.value).then((coord) => {
        this.props.setRangePolygonAutocompleteDestination(coord);
      });
    }
  }

  handleFromRequest = (chosenRequest) => {
    if (chosenRequest.value) {
      this.getCoordinateFromPlaceId(chosenRequest.value).then((coord) => {
        this.props.setRangePolygonAutocompleteOrigin(coord);
      });
    }
  }

  updateFromInput = (value) => {
    this.props.updateRangeFromField(value);
    this.updateAutocomplete(value);
  };

  updateToInput = (value) => {
    this.props.updateRangeToField(value);
    this.updateAutocomplete(value);
  };

  updateAutocomplete = (value) => {
    const callback = (predictions, status) => {
      if (status === window.google.maps.places.PlacesServiceStatus.OK) {
        const results = [];
        // add autocomplete prediction only for valid description and place_id
        predictions.forEach((prediction) => {
          if (prediction.description && prediction.place_id) {
            results.push({
              text: prediction.description,
              value: prediction.place_id,
            });
          }
        });
        this.setState({ dataSource: results });
      }
      else {
        this.setState({ dataSource: [] });
      }
    };

    if (value.length > 0 && this.state.autocompleteService) {
      this.state.autocompleteService.getQueryPredictions({ input: value }, callback);
    }
  };

  render() {
    return (
      <div style={styles.menu}>
        <div style={styles.autoCompleteWrapper}>
          <AutoComplete
            searchText={this.props.rangeFromField}
            floatingLabelText="From"
            onClick={() => this.props.updateRangeFromSelected(true)}
            onNewRequest={this.handleFromRequest}
            onUpdateInput={this.updateFromInput}
            dataSource={this.state.dataSource}
            filter={AutoComplete.noFilter}
            fullWidth
          />
        </div>
        <div style={styles.autoCompleteWrapper}>
          <AutoComplete
            searchText={this.props.rangeToField}
            floatingLabelText="To"
            onClick={() => this.props.updateRangeToSelected(true)}
            onNewRequest={this.handleToRequest}
            onUpdateInput={this.updateToInput}
            dataSource={this.state.dataSource}
            filter={AutoComplete.noFilter}
            fullWidth
          />
        </div>
        <SelectField
          floatingLabelText="Vehicle"
          value={this.props.vehicle}
          onChange={this.props.vehicleChange}
          maxHeight={210}
          fullWidth
        >
          {this.props.getVehicles().map((vehicle, index) => (
            <MenuItem key={vehicle} value={index} primaryText={vehicle} />
          ))}
        </SelectField>
        <p style={styles.batteryLevel}>
          <span>Battery Level</span>
          <span
            style={styles.batteryLevelValue}
            ref={node => (this.batteryLevel = node)}
          >
            {`${this.props.batteryPecentage}%`}
          </span>
        </p>
        <Slider
          onChange={this.props.updateBatterySlider}
          value={this.props.batteryLevel}
          sliderStyle={styles.reachabilitySlider}
        />
        <TextField
          onChange={this.props.updateRemainingRange}
          style={styles.rangeTextField}
          floatingLabelText="Remaining Range"
          value={Math.round(this.props.remainingRange * 100) / 100 || ''}
        />
        <div
          style={styles.buttonDiv}
        >
          <RaisedButton
            label="Display"
            onClick={this.props.getRangeVisualisation}
            icon={<FontIcon className="material-icons">map</FontIcon>}
            style={styles.displayButton}
          />
          {this.props.rangePolygonVisible ?
            <RaisedButton
              label="Hide"
              onClick={this.props.hideRangeVisualisation}
              icon={<FontIcon className="material-icons">map</FontIcon>}
            /> : null}
        </div>
      </div>
    );
  }
}

ReachabilityTab.propTypes = {
  vehicle: PropTypes.number.isRequired,
  batteryLevel: PropTypes.number.isRequired,
  batteryPecentage: PropTypes.number.isRequired,
  updateBatterySlider: PropTypes.func.isRequired,
  rangePolygonVisible: PropTypes.bool.isRequired,
  remainingRange: PropTypes.number.isRequired,
  updateRemainingRange: PropTypes.func.isRequired,
  getVehicles: PropTypes.func.isRequired,
  vehicleChange: PropTypes.func.isRequired,
  getRangeVisualisation: PropTypes.func.isRequired,
  hideRangeVisualisation: PropTypes.func.isRequired,
  rangeFromField: PropTypes.string.isRequired,
  updateRangeFromField: PropTypes.func.isRequired,
  updateRangeFromSelected: PropTypes.func.isRequired,
  rangeToField: PropTypes.string.isRequired,
  updateRangeToField: PropTypes.func.isRequired,
  updateRangeToSelected: PropTypes.func.isRequired,
  setRangePolygonAutocompleteOrigin: PropTypes.func.isRequired,
  setRangePolygonAutocompleteDestination: PropTypes.func.isRequired,
};

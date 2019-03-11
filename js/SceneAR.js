'use strict';
import React, { Component } from 'react';
import { StyleSheet, NativeEventEmitter, DeviceEventEmitter, AsyncStorage, PermissionsAndroid } from 'react-native';
import Geolocation from 'react-native-geolocation-service'
import {
  ViroARScene,
  ViroText,
  ViroConstants,
} from 'react-viro';
import RNSimpleCompass from 'react-native-simple-compass';

const degree_update_rate = 3; // Number of degrees changed before the callback is triggered

export default class SceneAR extends Component {
  async requestLocationPermission() {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          'title': 'UnalAR',
          'message': 'UnalAR requiere tu localización'
        }
      )
      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        //console.log("You can use the location")
        //alert("You can use the location");
        Geolocation.getCurrentPosition((Degree = this.state.Degree) => { //change to position if degree doesnt work
          this.setState({
            latitude: Degree.coords.latitude,
            longitude: Degree.coords.longitude,
            error: null,
            string: String(Degree.coords.latitude)
          });
        }, (error) => this.setState({ error: error.message }),
          { enableHighAccuracy: true }
        )
      } else {
        //console.log("location permission denied")
        alert("No se puede usar la localización");
      }
      return granted;
    } catch (err) {
      console.warn(err)
    }
  }

  constructor() {
    super();
    this.requestLocationPermission = this.requestLocationPermission.bind(this);
    // Set initial state here
    this.state = {
      text: "Inicializando...",
      latitude: 0,
      longitude: 0,
      cytX: 0,
      cytZ: 0,
      quimicaX: 0,
      quimicaZ: 0,
      aulasX: 0,
      aulasZ: 0,
      Heading: 0,
    };

    // bind 'this' to functions   
    this._onInitialized = this._onInitialized.bind(this);
    this._latLongToMerc = this._latLongToMerc.bind(this);
    this._transformPointToAR = this._transformPointToAR.bind(this);

    RNSimpleCompass.start(degree_update_rate, (degree) => {
      var grados = degree;
      this.setState({ Heading: grados });
      RNSimpleCompass.stop();
    });
  }
  componentDidMount() {
    this.requestLocationPermission();
  }
  componentWillUnmount() {
  }
  render() {
    return (<ViroARScene onTrackingUpdated={this._onInitialized}>
      <ViroText text="CyT" scale={[4, 4, 4]} transformBehaviors={["billboard"]} position={[this.state.cytX, 0, this.state.cytZ]} style={styles.helloWorldTextStyle} />
      <ViroText text="Química" scale={[4, 4, 4]} transformBehaviors={["billboard"]} position={[this.state.quimicaX, 0, this.state.quimicaZ]} style={styles.helloWorldTextStyle} />
      <ViroText text="Aulas" scale={[4, 4, 4]} transformBehaviors={["billboard"]} position={[this.state.aulasX, 0, this.state.aulasZ]} style={styles.helloWorldTextStyle} />
    </ViroARScene>);
  }
  _onInitialized() {
    var cyt = this._transformPointToAR(4.6381390, -74.0845033);
    var qumica = this._transformPointToAR(4.6376711, -74.0836540);
    var aulas = this._transformPointToAR(4.6385059, -74.0835930);
    this.setState({
      cytX: cyt.x,
      cytZ: cyt.z,
      quimicaX: qumica.x,
      quimicaZ: qumica.z,
      aulasX: aulas.x,
      aulasZ: aulas.z,
      text: "AR Init called."
    });
  }
  _latLongToMerc(lat_deg, lon_deg) {
    var lon_rad = (lon_deg / 180.0 * Math.PI)
    var lat_rad = (lat_deg / 180.0 * Math.PI)
    var sm_a = 637813.70
    var xmeters = sm_a * lon_rad
    var ymeters = sm_a * Math.log((Math.sin(lat_rad) + 1) / Math.cos(lat_rad))
    return ({ x: xmeters, y: ymeters });
  }
  _transformPointToAR(lat, long) {
    var objPoint = this._latLongToMerc(lat, long);
    var devicePoint = this._latLongToMerc(this.state.latitude, this.state.longitude);

    var objPointX = objPoint.x * Math.cos(this.state.Heading) + objPoint.y * Math.sin(this.state.Heading);
    var objPointY = objPoint.y * Math.cos(this.state.Heading) - objPoint.x * Math.sin(this.state.Heading);

    var objFinalPosZ = (objPoint.y - devicePoint.y);
    var objFinalPosX = (objPoint.x - devicePoint.x);

    return ({ x: objFinalPosX, z: -objFinalPosZ });
  }
}
var styles = StyleSheet.create({
  helloWorldTextStyle: {
    fontFamily: 'Source Sans Pro',
    fontSize: 150,
    color: '#2c3e50',
    fontWeight: 'bold',
    textAlignVertical: 'center',
    textAlign: 'center',
  },
});

module.exports = SceneAR; 
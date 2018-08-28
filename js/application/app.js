/*
 | Copyright 2016 Esri
 |
 | Licensed under the Apache License, Version 2.0 (the "License");
 | you may not use this file except in compliance with the License.
 | You may obtain a copy of the License at
 |
 |    http://www.apache.org/licenses/LICENSE-2.0
 |
 | Unless required by applicable law or agreed to in writing, software
 | distributed under the License is distributed on an "AS IS" BASIS,
 | WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 | See the License for the specific language governing permissions and
 | limitations under the License.
 */
define([
  "calcite",
  "boilerplate/ItemHelper",
  "boilerplate/UrlParamHelper",
  "dojo/i18n!./nls/resources",
  "dojo/_base/declare",
  "dojo/_base/lang",
  "dojo/_base/Color",
  "dojo/colors",
  "dojo/date",
  "dojo/date/locale",
  "dojo/number",
  "dojo/query",
  "dojo/Deferred",
  "dojo/on",
  "dojo/dom",
  "dojo/dom-attr",
  "dojo/dom-class",
  "dojo/dom-style",
  "dojo/dom-geometry",
  "dojo/dom-construct",
  "dijit/ConfirmDialog",
  "esri/request",
  "esri/identity/IdentityManager",
  "esri/core/watchUtils",
  "esri/core/promiseUtils",
  "esri/portal/Portal",
  "esri/Graphic",
  "esri/symbols/PointSymbol3D",
  "esri/symbols/IconSymbol3DLayer",
  "esri/symbols/callouts/LineCallout3D",
  "esri/layers/Layer",
  "esri/layers/support/MosaicRule",
  "esri/layers/support/DimensionalDefinition",
  "esri/tasks/ImageServiceIdentifyTask",
  "esri/tasks/support/ImageServiceIdentifyParameters",
  "esri/widgets/Home",
  "esri/widgets/Search",
  "esri/widgets/LayerList",
  "esri/widgets/Legend",
  "esri/widgets/Print",
  "esri/widgets/ScaleBar",
  "esri/widgets/Compass",
  "esri/widgets/BasemapGallery",
  "esri/widgets/Expand",
  "dojo/domReady!"
], function (calcite, ItemHelper, UrlParamHelper, i18n, declare, lang, Color, colors, date, locale, number, query, Deferred, on,
             dom, domAttr, domClass, domStyle, domGeom, domConstruct, ConfirmDialog,
             esriRequest, IdentityManager, watchUtils, promiseUtils, Portal, Graphic, PointSymbol3D, IconSymbol3DLayer, LineCallout3D,
             Layer, MosaicRule, DimensionalDefinition, ImageServiceIdentifyTask, ImageServiceIdentifyParameters,
             Home, Search, LayerList, Legend, Print, ScaleBar, Compass, BasemapGallery, Expand) {

  return declare(null, {

    config: null,
    direction: null,

    /**
     *
     */
    constructor() {
      calcite.init();
    },

    /**
     *
     * @param boilerplateResponse
     */
    init: function (boilerplateResponse) {
      if(boilerplateResponse) {
        this.direction = boilerplateResponse.direction;
        this.config = boilerplateResponse.config;
        this.settings = boilerplateResponse.settings;
        const boilerplateResults = boilerplateResponse.results;
        const webMapItem = boilerplateResults.webMapItem;
        const webSceneItem = boilerplateResults.webSceneItem;
        const groupData = boilerplateResults.group;

        document.documentElement.lang = boilerplateResponse.locale;

        this.urlParamHelper = new UrlParamHelper();
        this.itemHelper = new ItemHelper();

        this._setDirection();

        if(webMapItem) {
          this._createWebMap(webMapItem);
        } else if(webSceneItem) {
          this._createWebScene(webSceneItem);
        } else if(groupData) {
          this._createGroupGallery(groupData);
        } else {
          this.reportError(new Error("app:: Could not load an item to display"));
        }
      }
      else {
        this.reportError(new Error("app:: Boilerplate is not defined"));
      }
    },

    /**
     *
     * @param error
     * @returns {*}
     */
    reportError: function (error) {
      // remove loading class from body
      //domClass.remove(document.body, CSS.loading);
      //domClass.add(document.body, CSS.error);
      // an error occurred - notify the user. In this example we pull the string from the
      // resource.js file located in the nls folder because we've set the application up
      // for localization. If you don't need to support multiple languages you can hardcode the
      // strings here and comment out the call in index.html to get the localization strings.
      // set message
      let node = dom.byId("loading_message");
      if(node) {
        //node.innerHTML = "<h1><span class=\"" + CSS.errorIcon + "\"></span> " + i18n.error + "</h1><p>" + error.message + "</p>";
        node.innerHTML = "<h1><span></span>" + i18n.error + "</h1><p>" + error.message + "</p>";
      }
      return error;
    },

    /**
     *
     * @private
     */
    _setDirection: function () {
      let direction = this.direction;
      let dirNode = document.getElementsByTagName("html")[0];
      domAttr.set(dirNode, "dir", direction);
    },

    /**
     *
     * @param webMapItem
     * @private
     */
    _createWebMap: function (webMapItem) {
      this.itemHelper.createWebMap(webMapItem).then(function (map) {

        let viewProperties = {
          map: map,
          container: this.settings.webmap.containerId
        };

        if(!this.config.title && map.portalItem && map.portalItem.title) {
          this.config.title = map.portalItem.title;
        }

        lang.mixin(viewProperties, this.urlParamHelper.getViewProperties(this.config));
        require(["esri/views/MapView"], function (MapView) {

          let view = new MapView(viewProperties);
          view.when(function (response) {
            this.urlParamHelper.addToView(view, this.config);
            this._ready(view);
          }.bind(this), this.reportError);

        }.bind(this));
      }.bind(this), this.reportError);
    },

    /**
     *
     * @param webSceneItem
     * @private
     */
    _createWebScene: function (webSceneItem) {
      this.itemHelper.createWebScene(webSceneItem).then(function (map) {

        let viewProperties = {
          map: map,
          container: this.settings.webscene.containerId
        };

        if(!this.config.title && map.portalItem && map.portalItem.title) {
          this.config.title = map.portalItem.title;
        }

        lang.mixin(viewProperties, this.urlParamHelper.getViewProperties(this.config));
        require(["esri/views/SceneView"], function (SceneView) {

          let view = new SceneView(viewProperties);
          view.when(function (response) {
            this.urlParamHelper.addToView(view, this.config);
            this._ready(view);
          }.bind(this), this.reportError);
        }.bind(this));
      }.bind(this), this.reportError);
    },

    /**
     *
     * @param groupData
     * @private
     */
    _createGroupGallery: function (groupData) {
      let groupInfoData = groupData.infoData;
      let groupItemsData = groupData.itemsData;

      if(!groupInfoData || !groupItemsData || groupInfoData.total === 0 || groupInfoData instanceof Error) {
        this.reportError(new Error("app:: group data does not exist."));
        return;
      }

      let info = groupInfoData.results[0];
      let items = groupItemsData.results;

      this._ready();

      if(info && items) {
        let html = "";

        html += "<h1>" + info.title + "</h1>";

        html += "<ol>";

        items.forEach(function (item) {
          html += "<li>" + item.title + "</li>";
        });

        html += "</ol>";

        document.body.innerHTML = html;
      }

    },

    /**
     *
     * @private
     */
    _ready: function (view) {

      // TITLE //
      document.title = dom.byId("app-title-node").innerHTML = this.config.title;

      //const fontFamily = window.getComputedStyle(dom.byId("app-title-node"), null).getPropertyValue("font");

      //
      // WIDGETS IN VIEW UI //
      //

      // HOME //
      const homeWidget = new Home({ view: view });
      view.ui.add(homeWidget, { position: "top-left", index: 1 });

      // COMPASS //
      if(view.type === "2d") {
        const compass = new Compass({ view: view });
        view.ui.add(compass, "top-left");
      }

      // SCALEBAR //
      const scaleBar = new ScaleBar({ view: view, unit: "dual" });
      view.ui.add(scaleBar, { position: "bottom-left" });

      //
      // WIDGETS IN EXPAND //
      //

      // SEARCH //
      const searchWidget = new Search({
        view: view,
        container: domConstruct.create("div")
      });
      // EXPAND SEARCH //
      const toolsExpand = new Expand({
        view: view,
        content: searchWidget.domNode,
        expandIconClass: "esri-icon-search",
        expandTooltip: "Search"
      }, domConstruct.create("div"));
      view.ui.add(toolsExpand, "top-right");


      // USER SIGN IN //
      this.initializeUserSignIn(view);

      // MAP DETAILS //
      this.displayMapDetails(view);


      // SEA SURFACE TEMPERATURE //
      this.initializeSeaSurfaceTemp(view);

    },

    /**
     * USER SIGN IN
     */
    initializeUserSignIn: function (view) {

      // TOGGLE SIGN IN/OUT //
      let signInNode = dom.byId("sign-in-node");
      let signOutNode = dom.byId("sign-out-node");
      let userNode = dom.byId("user-node");

      // SIGN IN //
      let userSignIn = () => {
        this.portal = new Portal({ authMode: "immediate" });
        this.portal.load().then(() => {
          //console.info(this.portal, this.portal.user);

          dom.byId("user-firstname-node").innerHTML = this.portal.user.fullName.split(" ")[0];
          dom.byId("user-fullname-node").innerHTML = this.portal.user.fullName;
          dom.byId("username-node").innerHTML = this.portal.user.username;
          dom.byId("user-thumb-node").src = this.portal.user.thumbnailUrl;

          domClass.add(signInNode, "hide");
          domClass.remove(userNode, "hide");

          // MAP DETAILS //
          this.displayMapDetails(view, this.portal);

        }).otherwise(console.warn);
      };

      // SIGN OUT //
      let userSignOut = () => {
        IdentityManager.destroyCredentials();
        this.portal = new Portal({});
        this.portal.load().then(() => {

          this.portal.user = null;
          domClass.remove(signInNode, "hide");
          domClass.add(userNode, "hide");

          // MAP DETAILS //
          this.displayMapDetails(view);
        }).otherwise(console.warn);
      };

      // CALCITE CLICK EVENT //
      on(signInNode, "click", userSignIn);
      on(signOutNode, "click", userSignOut);

      // PORTAL //
      this.portal = new Portal({});
      this.portal.load().then(() => {
        // CHECK THE SIGN IN STATUS WHEN APP LOADS //
        IdentityManager.checkSignInStatus(this.portal.url).then(userSignIn);
      }).otherwise(console.warn);
    },

    /**
     * DISPLAY MAP DETAILS
     *
     * @param view
     * @param portal
     */
    displayMapDetails: function (view, portal) {

      const item = view.map.portalItem;
      const itemLastModifiedDate = (new Date(item.modified)).toLocaleString();

      dom.byId("current-map-card-thumb").src = item.thumbnailUrl;
      dom.byId("current-map-card-thumb").alt = item.title;
      dom.byId("current-map-card-caption").innerHTML = lang.replace("A map by {owner}", item);
      dom.byId("current-map-card-caption").title = "Last modified on " + itemLastModifiedDate;
      dom.byId("current-map-card-title").innerHTML = item.title;
      dom.byId("current-map-card-title").href = lang.replace("//{urlKey}.{customBaseUrl}/home/item.html?id={id}", {
        urlKey: portal ? portal.urlKey : "www",
        customBaseUrl: portal ? portal.customBaseUrl : "arcgis.com",
        id: item.id
      });
      dom.byId("current-map-card-description").innerHTML = item.description;

    },


    /**
     *
     *  https://www.epochconverter.com/
     * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/UTC
     *
     * @param view
     */
    initializeSeaSurfaceTemp: function (view) {

      // SETTINGS //
      this.settings = {
        variableName: "analysed_sst",
        dimensionName: "StdTime",
        currentLocation: null,
        currentDate: null,
        currentYear: (new Date()).getFullYear()
      };

      // LOCATION GRAPHIC //
      let locationGraphic = new Graphic({
        symbol: new PointSymbol3D({
          symbolLayers: [
            new IconSymbol3DLayer({
              resource: { primitive: "circle" },
              material: { color: "#2493f2" },
              size: 20
            })
          ],
          verticalOffset: { screenLength: 60 },
          callout: new LineCallout3D({
            size: 2.5,
            color: "white",
            border: { color: "#2493f2" }
          })
        })
      });
      view.graphics.add(locationGraphic);


      const locationPanel = domConstruct.create("div", { className: "esri-widget panel" });
      view.ui.add(locationPanel, "bottom-left");
      const locationNode = domConstruct.create("div", { className: "text-center" }, locationPanel);
      // const locationMsgNode = domConstruct.create("div", { className: "text-center font-size--3 text-dark-gray avenir-italic", innerHTML: "Click on the map to set the current location<br>Click on the chart to set the current day" }, locationPanel);
      const locationMsgNode = domConstruct.create("ul", { className: "font-size--3 text-dark-gray avenir-italic trailer-0" }, locationPanel);
      domConstruct.create("li", { className: "msg-item", innerHTML: "Click on the map to set the current location" }, locationMsgNode);
      domConstruct.create("li", { className: "msg-item", innerHTML: "Click on the chart to set the current day" }, locationMsgNode);

      // UPDATE LOCATION GRAPHIC //
      this.updateLocationGraphic = (location) => {
        this.settings.currentLocation = location;
        view.graphics.remove(locationGraphic);
        locationGraphic = locationGraphic.clone();
        locationGraphic.geometry = location;
        view.graphics.add(locationGraphic);
        if(location) {
          locationNode.innerHTML = lang.replace("Lon:{longitude} Lat:{latitude}", {
            longitude: location.longitude.toFixed(6),
            latitude: location.latitude.toFixed(6)
          });
        }
      };
      this.updateLocationGraphic(view.extent.center);

      // SEA SURFACE TEMPERATURE LAYER //
      this.seaSurfaceTemperatureLayer = view.map.layers.find((layer) => {
        return (layer.title === "Sea Surface Temperatures");
      });
      this.seaSurfaceTemperatureLayer.load().then(() => {
        this.seaSurfaceTemperatureLayer.popupEnabled = false;


        const legendPanel = domConstruct.create("div", { className: "esri-widget panel panel-no-padding" });
        view.ui.add(legendPanel, "bottom-right");
        const legend = new Legend({
          view: view,
          layerInfos: [{
            layer: this.seaSurfaceTemperatureLayer
          }],
          container: domConstruct.create("div", {}, legendPanel)
        });


        // DOES THIS LAYER HAVE MULTIDIMENSIONAL INFORMATION //
        if(this.seaSurfaceTemperatureLayer.hasMultidimensions) {

          // LAYER MOSAIC RULE //
          this.layerMosaicRule = this.seaSurfaceTemperatureLayer.mosaicRule;
          // LAYER MULTIDIMENSIONAL DEFINITION //
          this.layerDimensionDefinition = this.layerMosaicRule.multidimensionalDefinition[0];
          this.layerDimensionDefinition.variableName = this.settings.variableName;
          this.layerDimensionDefinition.dimensionName = this.settings.dimensionName;

          // UPDATE LAYER DISPLAY //
          this.updateLayerDisplay = (dataInfo) => {
            // UPDATE LAYER DIMENSION DEFINITION //
            this.layerDimensionDefinition.values = [dataInfo.stdTime];
            // UPDATE DAY LABEL /
            this.updateDayLabel(dataInfo);
            // CLOSE POPUP //
            view.popup.close();
            // FORCE LAYER TO REFRESH/UPDATE //
            view.extent = view.extent;
          };

          // SERVICE MULTIDIMENSIONAL INFO //
          const multidimensionalInfo = this.seaSurfaceTemperatureLayer.multidimensionalInfo;
          // MULTIDIMENSIONAL VARIABLE //
          const multidimensionalVariable = multidimensionalInfo.variables.find((variable) => {
            // name, description, unit
            return (variable.name === this.settings.variableName);
          });
          // MULTIDIMENSIONAL DIMENSION //
          const multidimensionalDimension = multidimensionalVariable.dimensions.find((dimension) => {
            // name, description, extent[0][1], field, hasRanges, hasRegularIntervals, interval, intervalUnit, unit, values
            return (dimension.name === this.settings.dimensionName);
          });
          // MULTIDIMENSIONAL DIMENSION VALUES //
          //const dimensionValues = multidimensionalDimension.values;

          // DIMENSIONAL DATE INFO //
          const dimensionValuesMin = multidimensionalDimension.extent[0];
          const dimensionValuesMax = multidimensionalDimension.extent[1];
          const dimensionMinDate = new Date(dimensionValuesMin);
          const dimensionMaxDate = new Date(dimensionValuesMax);
          this.settings.dimensionDateInfo = {
            min: dimensionMinDate,
            max: dimensionMaxDate,
            minYear: dimensionMinDate.getFullYear(),
            maxYear: dimensionMaxDate.getFullYear()
          };

          const yearInput = dom.byId("year-input");
          const yearLabel = dom.byId("year-label");
          yearInput.max = this.settings.dimensionDateInfo.maxYear;
          yearInput.min = this.settings.dimensionDateInfo.minYear;
          on(dom.byId("year-input"), "input", () => {
            this.settings.currentYear = yearLabel.innerHTML = dom.byId("year-input").valueAsNumber;
            this.settings.currentDate.setUTCFullYear(this.settings.currentYear);
          });
          on(dom.byId("year-input"), "change", () => {
            this.settings.currentYear = yearLabel.innerHTML = dom.byId("year-input").valueAsNumber;
            this.settings.currentDate.setUTCFullYear(this.settings.currentYear);
            this.updateAnalysis();
          });

          // DAY LABEL //
          const monthNamesWide = locale.getNames("months", "wide");
          this.updateDayLabel = (dateInfo) => {
            this.settings.currentDate = dateInfo.stdDate;
            this.settings.currentYear = yearInput.value = yearLabel.innerHTML = dateInfo.stdDate.getUTCFullYear();
            dom.byId("day-input").value = lang.replace("{month} {day}", {
              day: dateInfo.stdDate.getUTCDate(),
              month: monthNamesWide[dateInfo.stdDate.getUTCMonth()]
            });
          };

          const today = new Date();
          const startDateValue = Date.UTC(2009, 0, 1, 0, 0, 0, 0);
          //const startDateValue = this.layerDimensionDefinition.values[0];
          this.updateDayLabel({
            x: 0, stdDate: new Date(startDateValue)
          });

          // LAYER UPDATING UI //
          view.whenLayerView(this.seaSurfaceTemperatureLayer).then((layerView) => {
            const updatingNode = dom.byId("loading-node");
            view.ui.add(updatingNode, "bottom-right");
            watchUtils.init(layerView, "updating", (updating) => {
              domClass.toggle(updatingNode, "is-active", updating);
            });
          });

          // INITIALIZE CHART //
          this.initializeTemperatureChart().then(() => {

            // IMAGE SERVER IDENTIFY //
            this.imageServiceIdentifyTask = new ImageServiceIdentifyTask({
              url: this.seaSurfaceTemperatureLayer.url
            });
            this.imageServiceIdentifyParameters = new ImageServiceIdentifyParameters({
              returnCatalogItems: true
            });

            // VIEW CLICK EVENT //
            view.on("click", (evt) => {
              if(!evt.mapPoint) { return; }
              this.updateLocationGraphic(evt.mapPoint);
              this.updateAnalysis();
            });

            // UPDATE ANALYSIS //
            this.updateAnalysis();

          });

        } else {
          dom.byId("temperature-node").innerHTML = "This layer doesn't provide Multidimensional information."
        }

      });

    },

    /**
     *
     */
    updateAnalysis: function () {

      if(!this.settings.currentLocation) {
        return;
      }

      this.clearTemperatureChart();
      domClass.add(dom.byId("loading-temps-node"), "is-active");

      const currentYearRange = [
        Date.UTC(this.settings.currentYear, 0, 1, 0, 0, 0, 0),
        Date.UTC(this.settings.currentYear, 11, 31, 0, 0, 0, 0)
      ];

      const mosaicRule = MosaicRule.fromJSON(this.layerMosaicRule.toJSON());
      mosaicRule.multidimensionalDefinition = [
        new DimensionalDefinition({
          variableName: this.settings.variableName,
          dimensionName: this.settings.dimensionName,
          isSlice: false,
          values: [currentYearRange]
        })
      ];
      mosaicRule.ascending = false;
      this.imageServiceIdentifyParameters.mosaicRule = mosaicRule;
      this.imageServiceIdentifyParameters.geometry = this.settings.currentLocation;
      this.imageServiceIdentifyTask.execute(this.imageServiceIdentifyParameters).then((imageServiceIdentifyResult) => {

        const features = imageServiceIdentifyResult.catalogItems.features;

        //console.info("Data Count: ", this.settings.currentYear, imageServiceIdentifyResult.properties.Values.length);

        const temperatureValues = imageServiceIdentifyResult.properties.Values.map((value, valueIndex) => {

          const stdTime = features[valueIndex].getAttribute("StdTime");
          const stdDate = new Date(stdTime);
          const startDate = new Date(currentYearRange[0]);
          const dayOfYear = date.difference(startDate, stdDate, "day");

          //console.info(startDate.getUTCFullYear(), dayOfYear);

          return {
            x: dayOfYear,
            stdTime: stdTime,
            stdDate: stdDate,
            y: +value
          };
        });

        this.updateTemperatureChart(temperatureValues);

      }).otherwise((error) => {
        console.warn(error);
      }).always(() => {
        domClass.remove(dom.byId("loading-temps-node"), "is-active");
      });

    },

    /**
     *
     */
    initializeTemperatureChart: function () {
      const deferred = new Deferred();

      require([
        "dojox/charting/Chart",
        "dojox/charting/themes/Adobebricks",
        "dojox/charting/axis2d/Default",
        "dojox/charting/plot2d/Lines",
        "dojox/charting/plot2d/Grid",
        "dojox/charting/plot2d/Indicator",
        "dojox/charting/action2d/MouseIndicator"
      ], (Chart, chartTheme, Default, Lines, Grid, Indicator, MouseIndicator) => {

        const monthNamesAbbr = locale.getNames("months", "abbr");
        const monthNamesWide = locale.getNames("months", "wide");

        const temperatureChart = new Chart("temperature-chart", {
          margins: { l: 60, t: 5, r: 60, b: 10 }
        });
        temperatureChart.setTheme(chartTheme);
        temperatureChart.fill = temperatureChart.theme.plotarea.fill = "transparent";

        // DEFAULT PLOT //
        temperatureChart.addPlot("default", { type: Lines, markers: false, tension: "S" });
        // FAHRENHEIT PLOT //
        temperatureChart.addPlot("other", { type: Lines, markers: false, tension: "S", hAxis: "x", vAxis: "other y" });

        // X AXIS //
        temperatureChart.addAxis("x", {
          min: 0,
          max: 366,
          minorTicks: false,
          majorTickStep: 14,
          stroke: { color: "#ddd" },
          fontColor: "#2493f2",
          title: "Daily Temperatures",
          titleGap: 10,
          titleOrientation: "away",
          titleFont: "normal normal normal 13pt Avenir Next W02",
          titleFontColor: "#2493f2",
          font: "normal normal normal 8pt Avenir Next W01",
          labelFunc: (text, value, precision) => {

            const currentYearStart = new Date(Date.UTC(this.settings.currentYear, 0, 1, 0, 0, 0, 0));
            const stdDate = date.add(currentYearStart, "day", value);

            return lang.replace("{month} {day}", {
              day: stdDate.getUTCDate(),
              month: monthNamesAbbr[stdDate.getUTCMonth()],
              year: stdDate.getUTCFullYear()
            });

          }
        });
        // UPDATE X AXIS //
        const updateXAxisTitle = () => {
          temperatureChart.getAxis("x").opt.title = "Daily Temperatures - " + (this.settings.currentYear || "");
          temperatureChart.getAxis("x").dirty = true;
        };

        const celsiusToFahrenheit = (tempC) => {
          return ((tempC * (9 / 5)) + 32);
        };

        const tempAxisLabel = (text) => {
          return text + "\xB0"
        };

        // Y AXIS //
        temperatureChart.addAxis("y", {
          stroke: { color: "#ddd" },
          vertical: true, fixLower: "minor", fixUpper: "minor", minorTicks: false,
          labelFunc: tempAxisLabel,
          title: "Celsius",
          titleGap: 10,
          titleOrientation: "axis",
          titleFontColor: "#2493f2",
          fontColor: "#2493f2",
          font: "normal normal normal 8pt Avenir Next W01"
        });

        // FAHRENHEIT AXIS //
        temperatureChart.addAxis("other x", { leftBottom: false });
        temperatureChart.addAxis("other y", {
          leftBottom: false,
          stroke: { color: "#ddd" },
          vertical: true, fixLower: "minor", fixUpper: "minor", minorTicks: false,
          labelFunc: tempAxisLabel,
          title: "Fahrenheit",
          titleGap: 10,
          titleOrientation: "away",
          titleFontColor: "#2493f2",
          fontColor: "#2493f2",
          font: "normal normal normal 8pt Avenir Next W01"
        });

        // TEMPERATURES SERIES //
        const emptySeries = [{ x: 0, y: 0.0 }, { x: 366, y: 0.0 }];
        temperatureChart.addSeries("Temperatures C", emptySeries, { stroke: { width: 1.5, color: "red" } });
        temperatureChart.addSeries("Temperatures F", emptySeries, { plot: "other", stroke: { width: 0, color: "red" } });

        // UPDATE CHART //
        this.updateTemperatureChart = (temperatureValues) => {
          //const startDate = new Date(Date.UTC(this.settings.currentYear, 0, 1, 0, 0, 0, 0));
          //const dayOfYear = date.difference(startDate, this.settings.stdDate, "day");

          // CONVERT TO FAHRENHEIT //
          const temperatureValuesF = temperatureValues.map((tempInfo) => {
            return lang.mixin({}, tempInfo, { y: celsiusToFahrenheit(tempInfo.y) });
          });
          temperatureChart.updateSeries("Temperatures C", temperatureValues);
          temperatureChart.updateSeries("Temperatures F", temperatureValuesF);
          // TODO: THIS SHOULD NOT BE THE FIRST VALUE...
          updateCurrentDayIndicator([temperatureValues[0].x]);
          updateXAxisTitle();
          temperatureChart.fullRender();
        };

        // CLEAR CHART //
        this.clearTemperatureChart = () => {
          temperatureChart.updateSeries("Temperatures C", []);
          temperatureChart.updateSeries("Temperatures F", []);
          updateCurrentDayIndicator([]);
          updateXAxisTitle();
          temperatureChart.fullRender();
        };


        // INDICATOR LABEL //
        const getIndicatorLabel = (dataInfo) => {
          //console.info("getIndicatorLabel: ", dataInfo);
          if(dataInfo.stdDate) {
            return lang.replace("On {month} {day}, {year} the temperature was {degC}\xB0 Celsius, {degF}\xB0 Fahrenheit", {
              day: dataInfo.stdDate.getUTCDate(),
              month: monthNamesWide[dataInfo.stdDate.getUTCMonth()],
              year: dataInfo.stdDate.getUTCFullYear(),
              degC: dataInfo.y.toFixed(1),
              degF: celsiusToFahrenheit(dataInfo.y).toFixed(1)
            });
          } else {
            return " ";
          }
        };

        // CURRENT DAY INDICATOR //
        temperatureChart.addPlot("CurrentDay", {
          type: Indicator,
          series: "Temperatures C",
          values: [],
          vertical: true,
          lineStroke: { color: "#2493f2" },
          stroke: null,
          outline: null,
          offset: { y: -20, x: 0 },
          fill: "#242424",
          fontColor: "#2493f2",
          font: "normal normal normal 13pt Avenir Next W01",
          labelFunc: (text, values) => {
            const dataInfo = temperatureChart.getSeries("Temperatures C").data.find((dataObj) => {
              return (dataObj.x === values[0]);
            });
            return dataInfo ? getIndicatorLabel(dataInfo) : " ";
          }
        });

        // UPDATE CURRENT DAY INDICATOR //
        const updateCurrentDayIndicator = (indicatorValues, update) => {
          temperatureChart.getPlot("CurrentDay").opt.values = indicatorValues;
          temperatureChart.getPlot("CurrentDay").dirty = true;
          if(update) {
            temperatureChart.getPlot("CurrentDay").render();
          }
        };

        // CURRENT DATA INFO //
        let currentMouseIndicatorDataInfo = null;

        // MOUSE INDICATOR - USED TO UPDATE CURRENT DAY INDICATOR //
        const defaultMouseIndicator = new MouseIndicator(temperatureChart, "default", {
          series: "Temperatures C",
          vertical: true,
          mouseOver: false,
          lineStroke: null,
          stroke: null,
          outline: null,
          labels: false,
          labelFunc: (obj) => {
            const dataInfo = temperatureChart.getSeries("Temperatures C").data.find((dataObj) => {
              return (dataObj.x === obj.x);
            });
            updateCurrentDayIndicator([dataInfo.x], true);
            currentMouseIndicatorDataInfo = dataInfo;
            return " "; // getIndicatorLabel(dataInfo);
          }
        });

        // UPDATE LAYER DISPLAY ON MOUSE UP //
        temperatureChart.surface.on("mouseup", (evt) => {
          if(currentMouseIndicatorDataInfo) {
            this.updateLayerDisplay(currentMouseIndicatorDataInfo);
          }
        });


        temperatureChart.addPlot("Grid", {
          type: Grid,
          hMajorLines: true,
          hMinorLines: false,
          vMajorLines: false,
          vMinorLines: false,
          majorHLine: { color: "#333", width: 1 }
        });


        // RENDER CHART //
        temperatureChart.render();

        // CHART IS READY SO RESOLVE THE DEFERRED //
        deferred.resolve();
      });

      return deferred.promise;
    }


  });
});
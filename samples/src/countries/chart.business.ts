import { ChartSetup, setup } from './chart.setup';
import { Country } from './data';
import { select, mouse } from "d3-selection";
import { scaleLinear, scaleLog, scaleSqrt, scaleOrdinal } from "d3-scale";
import { axisBottom, axisLeft } from "d3-axis";
import { extent } from "d3-array";
const d3 = { select, scaleLinear, scaleLog, scaleSqrt, scaleOrdinal,
  axisBottom, axisLeft, extent, mouse };

const style = require("./chart.style.scss");


// Module global variables.
let nodeRoot = null;
let svg = null;
let xScale = null;
let yScale = null;
let countryAreaScale = null;
let continentScale = null;
let infoPopup = null;


export const createChart = (node: Element, data: Country[]) => {
  // Create SVG.
  nodeRoot = node;
  svg = d3.select(nodeRoot)
    .append("svg")
      .attr("width", setup.width)
      .attr("height", setup.height);

  // Create effects
  const defs = svg.append("defs");
  createShadow(defs);

  // Create scales, axis, labels, country bubbles, etc.
  createScales(data);
  createAxis();
  createLabels();
  createPopup(nodeRoot);
  createCountries(data);
}

const createScales = (data: Country[]) => {
  // x Scale - Represents purchasing power. Log scale.
  xScale = d3.scaleLog().base(10).nice()
    .domain([setup.purchasingPowerMin, setup.purchasingPowerMax])
    .range([setup.marginLeft, setup.width - setup.marginRight]);

  // y Scale - Represents life expectancy. Linear.
  yScale = d3.scaleLinear().nice()
    .domain([setup.lifeExpectancyMin, setup.lifeExpectancyMax])
    .range([setup.height - setup.marginBottom, setup.marginTop]);

  // Country Area Scale - Represents population.
  countryAreaScale = d3.scaleSqrt()
    .domain(d3.extent(data, d => d.population))
    .range([1, 100]);

  // Continent Scale - Discrete scale to categorize countries per continent.
  continentScale = d3.scaleOrdinal()
    .domain(["África", "Asia", "América", "Europa", "Oceanía"])
    .range([
      `${style.continentAfrica}`,
      `${style.continentAsia}`,
      `${style.continentAmerica}`,
      `${style.continentEurope}`,
      `${style.continentOceania}`
    ]);
}

const createAxis = () => {
  const axisGroup = svg.append("g")
    .attr("class", style.axisGroup);

  // X axis - Purchasing Power.
  const fontSize = parseInt(getComputedStyle(document.body).fontSize, 10);
  axisGroup.append("g")
    .attr("class", style.axis)
    .attr("transform", `translate(0,${setup.height - setup.marginBottom})`)
    .call(d3.axisBottom(xScale)
      .ticks(Math.max((setup.width - setup.marginRight - setup.marginLeft) / (fontSize * 5), 8), "$.2s")
      .tickSizeOuter(0));

  // Y axis - Life Expectancy.
  axisGroup.append("g")
    .attr("class", style.axis)
    .attr("transform", `translate(${setup.marginLeft},0)`)
    .call(d3.axisLeft(yScale)
      .tickSizeOuter(0));
}

const createLabels = () => {
  const labels = svg.append("g")
    .attr("class", style.labels);
  const horMiddle = setup.marginLeft + (setup.width - setup.marginLeft - setup.marginRight) / 2;
  const vertMiddle = setup.marginTop + (setup.height - setup.marginTop - setup.marginBottom) / 2;

  // X Label
  labels.append("text")
    .attr("class", style.title)
    .attr("text-anchor", "middle")
    .attr("alignment-baseline", "after-edge")
    .attr("transform", `translate(${horMiddle},${setup.height})`)
    .text("Poder Adquisitivo");

  // Y Label
  labels.append("text")
    .attr("class", style.title)
    .attr("text-anchor", "middle")
    .attr("alignment-baseline", "hanging")
    .attr("transform", `translate(0,${vertMiddle})rotate(-90)`)
    .text("Esperanza de Vida");

  // Title
  labels.append("text")
    .attr("class", style.mainTitle)
    .attr("text-anchor", "middle")
    .attr("alignment-baseline", "hanging")
    .attr("transform", `translate(${horMiddle},0)`)
    .text("Distribución de la Riqueza por Paises");
}

const createCountries = (data: Country[]) => {
  svg.append("g")
      .attr("class", style.countries)
    .selectAll("circle")
    .data(data).enter()
    .append("circle")
      .attr("class", d => `${style.country} ${continentScale(d.continent)}`)
      .attr("cx", d => xScale(d.purchasingPower) + margin)
      .attr("cy", d => yScale(d.lifeExpectancy))
      .attr("r", d => countryAreaScale(d.population))
      .on("mouseenter", showInfoPopup)
      .on("mousemove", updatePositionInfoPopup)
      .on("mouseleave", hideInfoPopup)
    .sort((a, b) => (b.population - a.population));
}

const createPopup = (node) => {
  infoPopup = d3.select(node)
    .append("div")
      .attr("class", style.infoPopup);
}

const updatePositionInfoPopup = () => {
  let mousePosX = 0;
  let mousePosY = 0;

  if (d3.select("section[class='present']")) {  // Under reveal.js presentation.
    const revealScale = Number(document.getElementById("reveal-scale-node-id").getAttribute("data-reveal-scale"));
    const slide = d3.select("section[class='present']").node() as HTMLElement;
    mousePosX = (d3.mouse(slide)[0]) / revealScale;
    mousePosY = (d3.mouse(slide)[1]) / revealScale;
  } else {
    mousePosX = d3.mouse(document.body)[0] + 25;
    mousePosY = d3.mouse(document.body)[1] + 40;
  }

  infoPopup
    .style("left", `${mousePosX}px`)
    .style("top", `${mousePosY}px`);
}

const showInfoPopup = (d) => {
  infoPopup = infoPopup.html(
    `
    <table>
      <tr>
        <th class="${style.caption}">${d.country}</th>
        <th class="${style.subcaption} ${continentScale(d.continent)}">${d.continent}</th>
      </tr>
      <tr>
        <td class="${style.data}">${d.purchasingPower.toLocaleString()}</td>
        <td class="${style.units}">$</td>
      </tr>
      <tr>
        <td class="${style.data}">${d.lifeExpectancy.toLocaleString()}</td>
        <td class="${style.units}">Años</td>
      </tr>
      <tr>
        <td class="${style.data}">${d.population.toLocaleString()}</td>
        <td class="${style.units}">Habitantes</td>
      </tr>
    </table>
  `
  );
  updatePositionInfoPopup();
  infoPopup.style("opacity", 0.9);
}

const hideInfoPopup = () => {
  infoPopup.style("opacity", 0);
}

const createShadow = (defs) => {
  const filter = defs
    .append("filter")
      .attr("id", "bubbleShadow")
      .attr("filterUnits", "userSpaceOnUse")
      .attr("x", -50)
      .attr("y", -50)
      .attr("width", setup.width + 50)
      .attr("height", setup.height + 50)
  filter.append("feGaussianBlur")
    .attr("in", "SourceAlpha")
    .attr("result", "blurOut")
    .attr("stdDeviation", 10);
  filter.append("feOffset")
    .attr("in", "blurOut")
    .attr("result", "dropBlur")
    .attr("dx", 0)
    .attr("dy", 0);
  filter.append("feComposite")
    .attr("operator", "over")
    .attr("in", "SourceGraphic")
    .attr("in2", "dropBlur")
    .attr("result", "final");
}

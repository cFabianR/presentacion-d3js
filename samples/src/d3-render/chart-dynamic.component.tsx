import * as React from 'react';
import { createChart, updateChart } from './chart.business';

const style = require("./chart.style.scss");


interface ChartProps {
  data: number[];
}

export class ChartDynamicComponent extends React.Component<ChartProps, {}> {
  constructor(props) {
    super(props);
  }

  private rootNodeRef = null;

  private setRef = (componentNode) => {
    this.rootNodeRef = componentNode;
  }

  componentDidMount() {
    createChart(this.rootNodeRef, this.props.data);
  }

  shouldComponentUpdate(prevProps: ChartProps) {
    return Boolean(prevProps.data !== this.props.data)
  }

  componentDidUpdate() {
    updateChart(this.props.data);
  }

  public render() {
    return (
      <div className={style.container} ref={this.setRef} />
    );
  }
}

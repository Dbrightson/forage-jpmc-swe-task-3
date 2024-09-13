import React, { Component } from 'react';
import { Table } from '@finos/perspective';
import { ServerRespond } from './DataStreamer';
import { DataManipulator, Row } from './DataManipulator';
import './Graph.css';

interface IProps {
  data: ServerRespond[],
}

interface PerspectiveViewerElement extends HTMLElement {
  load: (table: Table) => void,
}

class Graph extends Component<IProps, {}> {
  table: Table | undefined;

  render() {
    return React.createElement('perspective-viewer');
  }

  componentDidMount() {
    // Get element from the DOM.
    const elem = document.getElementsByTagName('perspective-viewer')[0] as PerspectiveViewerElement;

    const schema = {
      price_abc: 'float',
      price_def: 'float',
      ratio: 'float',
      trigger_alert: 'float',
      upper_bound: 'float',
      lower_bound: 'float',
      timestamp: 'date',
    };

    if (window.perspective && window.perspective.worker()) {
      this.table = window.perspective.worker().table(schema);
    }
    if (this.table) {
      // Load the `table` in the `<perspective-viewer>` DOM reference.
      elem.load(this.table);
      elem.setAttribute('view', 'y_line');
      elem.setAttribute('row-pivots', '["timestamp"]');
      elem.setAttribute('columns', '["ratio", "lower_bound", "upper_bound", "trigger_alert"]');
      elem.setAttribute('aggregates', JSON.stringify({
        price_abc: 'avg',
        price_def: 'avg',
        ratio: 'avg',
        trigger_alert: 'avg',
        upper_bound: 'avg',
        lower_bound: 'avg',
        timestamp: 'distinct count',
      }));
    }
  }

  componentDidUpdate() {
    if (this.table) {
      const rows: Row[] = [DataManipulator.generateRow(this.props.data)];
      
      // Create a Record with an index signature
      const tableData: Record<string, (string | number | boolean | Date)[]> = rows.reduce((acc, row) => {
        for (const key in row) {
          if (row.hasOwnProperty(key)) {
            if (!acc[key]) {
              acc[key] = [];
            }
            // @ts-ignore
            acc[key].push(row[key as keyof Row]); // Use type assertion here
          }
        }
        return acc;
      }, {} as Record<string, (string | number | boolean | Date)[]>);

      this.table.update(tableData);
    }
  }
}

export default Graph;

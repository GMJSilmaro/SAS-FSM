import React, {
  Fragment,
  useMemo,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { Col, Row, Card } from "react-bootstrap";
import DataTable from "react-data-table-component";
import { Pagination } from "sub-components";

const EquipmentsUpdateTable = ({
  equipments,
  initialSelected,
  onSelectionChange,
}) => {
  const [selectedRows, setSelectedRows] = useState([]);
  const [filteredEquipments, setFilteredEquipments] = useState([]);

  useEffect(() => {
    if (initialSelected && equipments.length > 0) {
      const matchingEquipments = equipments.filter((equipment) =>
        initialSelected.some(
          (selected) =>
            equipment.SerialNo === (selected.serialNo || selected.SerialNo) &&
            equipment.ModelSeries ===
              (selected.modelSeries || selected.ModelSeries)
        )
      );

      setFilteredEquipments(matchingEquipments);
      setSelectedRows(matchingEquipments);
      onSelectionChange({ currentSelections: matchingEquipments });
    }
  }, [equipments, initialSelected]);

  const columns = [
    {
      name: "Serial No",
      selector: (row) => row.SerialNo,
      sortable: true,
    },
    {
      name: "Model Series",
      selector: (row) => row.ModelSeries,
      sortable: true,
    },
  ];

  const customStyles = {
    headRow: {
      style: {
        backgroundColor: "#f8f9fa",
        borderTopStyle: "solid",
        borderTopWidth: "1px",
        borderTopColor: "#dee2e6",
      },
    },
  };

  return (
    <Row>
      <Col xs={12}>
        <Card>
          <Card.Header>
            <h4 className="mb-1">Selected Equipment</h4>
            <p className="text-muted mb-0">
              Showing {filteredEquipments.length} matching equipment(s)
            </p>
          </Card.Header>
          <Card.Body className="p-0">
            <DataTable
              columns={columns}
              data={filteredEquipments}
              selectableRows
              selectableRowsHighlight
              pagination
              paginationPerPage={5}
              customStyles={customStyles}
              //onSelectedRowsChange={handleSelectionChange}
              selectableRowSelected={(row) => selectedRows.includes(row)}
              defaultSelectedRows={selectedRows}
            />
          </Card.Body>
        </Card>
      </Col>
    </Row>
  );
};

export default EquipmentsUpdateTable;

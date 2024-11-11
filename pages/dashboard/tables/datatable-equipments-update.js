import React, { useState, useEffect, useCallback } from "react";
import { Col, Row, Card, Button, Form } from "react-bootstrap";
import DataTable from "react-data-table-component";

const EquipmentsTableWithAddDelete = ({
  equipments = [],
  initialSelected = [],
  onSelectionChange,
}) => {
  const [editableEquipments, setEditableEquipments] = useState([]);
  const [selectedRows, setSelectedRows] = useState([]);
  const [filteredEquipments, setFilteredEquipments] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (equipments.length > 0) {
      // Create deep clones of equipment data
      const equipmentClone = equipments.map(equipment => ({
        ...equipment,
        isSelected: false,
        originalData: { ...equipment } // Keep original data for reference
      }));

      // Mark initially selected equipment
      if (initialSelected) {
        equipmentClone.forEach(equipment => {
          const isInitiallySelected = initialSelected.some(
            selected => 
              equipment.SerialNo === (selected.serialNo || selected.SerialNo) &&
              equipment.ModelSeries === (selected.modelSeries || selected.ModelSeries)
          );
          equipment.isSelected = isInitiallySelected;
        });
      }

      setEditableEquipments(equipmentClone);
      
      // Set initial selections
      const initialSelectedRows = equipmentClone.filter(eq => eq.isSelected);
      setSelectedRows(initialSelectedRows);
      setFilteredEquipments(equipmentClone);
    }
  }, [equipments, initialSelected]);

  const handleSelectionChange = useCallback(({ selectedRows: newSelectedRows }) => {
    setSelectedRows(newSelectedRows);

    // Update editable equipment states
    const updatedEquipments = editableEquipments.map(equipment => ({
      ...equipment,
      isSelected: newSelectedRows.some(
        selected => 
          selected.SerialNo === equipment.SerialNo &&
          selected.ModelSeries === equipment.ModelSeries
      )
    }));

    setEditableEquipments(updatedEquipments);
    
    // Notify parent with both current selections and original data
    onSelectionChange({
      currentSelections: newSelectedRows,
      originalData: newSelectedRows.map(row => row.originalData)
    });
  }, [editableEquipments, onSelectionChange]);

  const handleSearchChange = (e) => {
    const term = e.target.value;
    setSearchTerm(term);
    console.log("Search term:", term);

    const filtered = equipments.filter((equipment) => {
      return equipment.ItemName.toLowerCase().includes(term.toLowerCase());
      // equipment.modelSeries.toLowerCase().includes(term.toLowerCase())
    });

    //console.log("Filtered equipment:", filtered);
    setFilteredEquipments(filtered);
    setCurrentPage(1); // Reset to the first page whenever search changes
  };

  const handleAddEquipment = (equipment) => {
    console.log("Adding equipment:", equipment);
    if (!selectedRows.find((item) => item.serialNo === equipment.serialNo)) {
      const updatedSelected = [...selectedRows, equipment];
      setSelectedRows(updatedSelected);
      console.log("Updated selected rows after adding:", updatedSelected);
      onSelectionChange({ currentSelections: updatedSelected });
    }
  };

  const handleDeleteEquipment = (serialNo) => {
    console.log("Deleting equipment with SerialNo:", serialNo);
    // Only delete the specific equipment by SerialNo
    const updatedRows = selectedRows.filter((row) => row.serialNo !== serialNo);
    setSelectedRows(updatedRows);
    console.log("Updated selected rows after deleting:", updatedRows);
    onSelectionChange({ currentSelections: updatedRows });
  };

  // Define the columns to be used in both the "Selected" and "Available" tables
  const columns = [
    {
      name: "Item Name",
      selector: (row) => row.ItemName,
      sortable: true,
    },
    {
      name: "Serial No",
      selector: (row) => row.serialNo,
      sortable: true,
    },
    {
      name: "Model Series",
      selector: (row) => row.modelSeries,
      sortable: true,
    },
    {
      name: "Brand",
      selector: (row) => row.Brand,
      sortable: true,
    },

    {
      name: "Equipment Location",
      selector: (row) => row.equipmentLocation || "N/A",
      sortable: true,
    },
    {
      name: "Notes",
      selector: (row) => row.notes || "No Notes",
      sortable: true,
    },
    {
      name: "Actions",
      cell: (row) => (
        <Button
          variant="danger"
          size="sm"
          onClick={() => handleDeleteEquipment(row.serialNo)}
        >
          Delete
        </Button>
      ),
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
    headCells: {
      style: {
        fontSize: "14px",
        fontWeight: "bold",
      },
    },
  };

  // Pagination Logic for Available Equipment List
  const indexOfLastEquipment = currentPage * itemsPerPage;
  const indexOfFirstEquipment = indexOfLastEquipment - itemsPerPage;
  const currentEquipments = filteredEquipments.slice(
    indexOfFirstEquipment,
    indexOfLastEquipment
  );

  // console.log("Current page:", currentPage);
  // console.log("Current Equipments (paginated):", currentEquipments);

  const paginate = (pageNumber) => {
    //console.log("Changing page to:", pageNumber);
    setCurrentPage(pageNumber);
  };

  return (
    <Row>
      <Col xs={12}>
        <Card>
          <Card.Header>
            <h4 className="mb-1">Equipment List</h4>
            <p className="text-muted mb-0">
              Showing {selectedRows.length} selected equipment(s)
            </p>
          </Card.Header>
          <Card.Body className="p-0">
            <Form></Form>

            {/* Display selected rows in DataTable */}
            <h5 className="pt-4">Selected Equipment</h5>
            <DataTable
              columns={columns}
              data={selectedRows} // Display the selected equipment
              pagination
              paginationPerPage={5}
              customStyles={customStyles}
              onSelectedRowsChange={handleSelectionChange}
            />

            <Form.Group>
              <Form.Label>Search Equipment To (Add/Remove) </Form.Label>
              <Form.Control
                type="text"
                value={searchTerm}
                onChange={handleSearchChange}
                placeholder="Enter Serial No or Model Series"
              />
            </Form.Group>
            <div className="mt-3">
              <h5>Available Equipment (Add more)</h5>
              <DataTable
                columns={[
                  {
                    name: "Item Name",
                    selector: (row) => row.ItemName,
                    sortable: true,
                  },
                  {
                    name: "Serial No",
                    selector: (row) => row.serialNo,
                    sortable: true,
                  },
                  {
                    name: "Model Series",
                    selector: (row) => row.modelSeries,
                    sortable: true,
                  },
                  {
                    name: "Brand",
                    selector: (row) => row.Brand,
                    sortable: true,
                  },
                  {
                    name: "Equipment Location",
                    selector: (row) => row.equipmentLocation || "N/A",
                    sortable: true,
                  },
                  {
                    name: "Notes",
                    selector: (row) => row.notes || "No Notes",
                    sortable: true,
                  },
                  {
                    name: "Actions",
                    cell: (row) => (
                      <Button
                        variant={
                          selectedRows.find(
                            (item) => item.serialNo === row.serialNo
                          )
                            ? "danger"
                            : "primary"
                        }
                        size="sm"
                        onClick={() =>
                          selectedRows.find(
                            (item) => item.serialNo === row.serialNo
                          )
                            ? handleDeleteEquipment(row.serialNo)
                            : handleAddEquipment(row)
                        }
                      >
                        {selectedRows.find(
                          (item) => item.serialNo === row.serialNo
                        )
                          ? "Remove"
                          : "Add"}
                      </Button>
                    ),
                  },
                ]}
                data={currentEquipments} // Display only available equipment
                pagination
                paginationPerPage={5}
                customStyles={customStyles}
              />
            </div>

            <div className="mt-3 d-flex justify-content-center">
              <Button
                variant="link"
                onClick={() => paginate(currentPage - 1)}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <span className="mx-2">
                Page {currentPage} of{" "}
                {Math.ceil(filteredEquipments.length / itemsPerPage)}
              </span>
              <Button
                variant="link"
                onClick={() => paginate(currentPage + 1)}
                disabled={
                  currentPage ===
                  Math.ceil(filteredEquipments.length / itemsPerPage)
                }
              >
                Next
              </Button>
            </div>
          </Card.Body>
        </Card>
      </Col>
    </Row>
  );
};

export default EquipmentsTableWithAddDelete;

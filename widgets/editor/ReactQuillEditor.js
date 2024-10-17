import { useEffect } from 'react';
import { useQuill } from 'react-quilljs';

const ReactQuillEditor = ({ initialValue, onDescriptionChange }) => {
  const { quill, quillRef } = useQuill();

  useEffect(() => {
    if (quill) {
      // Set initial value for the editor (only once)
      quill.clipboard.dangerouslyPasteHTML(initialValue);

      // Listen to text-change events
      quill.on('text-change', () => {
        const htmlContent = quill.root.innerHTML;  // Get the updated HTML content
        if (onDescriptionChange) {
          onDescriptionChange(htmlContent);  // Pass HTML content to parent
        }
      });

      
      return () => {
        quill.off('text-change');
      };
    }
  }, [quill]);

  return (
    <div style={{ width: 'auto', height: 'auto' }}>
      <div ref={quillRef} />
    </div>
  );
};

export default ReactQuillEditor;



// import { useEffect } from 'react';
// import { useQuill } from 'react-quilljs';

// const ReactQuillEditor = ({ initialValue, onDescriptionChange }) => {
//   const { quill, quillRef } = useQuill();

//   useEffect(() => {
//     if (quill) {
//       // Set the initial value for the editor
//       quill.clipboard.dangerouslyPasteHTML(initialValue);

//       // Listen to text-change events
//       quill.on('text-change', () => {
//         const htmlContent = quill.root.innerHTML;  // Get the updated HTML content
//         if (onDescriptionChange) {
//           onDescriptionChange(htmlContent);  // Pass the updated content to parent
//         }
//       });

//       // Cleanup event listener to avoid multiple registrations
//       return () => {
//         quill.off('text-change');
//       };
//     }
//   }, [quill, initialValue, onDescriptionChange]);

//   return (
//     <div style={{ width: 'auto', height: 'auto' }}>
//       <div ref={quillRef} />
//     </div>
//   );
// };

// export default ReactQuillEditor;


// // import { useEffect } from 'react';
// // import { useQuill } from 'react-quilljs';

// // const ReactQuillEditor = ({ initialValue, onDescriptionChange  }) => {
// //   const { quill, quillRef } = useQuill();

// //   useEffect(() => {
// //     if (quill) {
// //       // Set the initial value for the editor
// //       quill.clipboard.dangerouslyPasteHTML(initialValue);
// //     }
// //   }, [quill, initialValue]); // Run only when quill is initialized and initial value changes

// //   return (
// //     <div style={{ width: 'auto', height: 'auto' }}>
// //       <div ref={quillRef} />
// //     </div>
// //   );
// // };

// // export default ReactQuillEditor;


// // // // import node module libraries
// // // import { useEffect } from 'react';
// // // import { useQuill } from 'react-quilljs';

// // // const ReactQuillEditor = (props) => {
// // // 	const {initialValue} = props;	
// // // 	const { quill, quillRef } = useQuill();	
// // // 	useEffect(() => {
// // // 		if (quill) {
// // // 		  quill.clipboard.dangerouslyPasteHTML(initialValue);
// // // 		  quill.on('text-change', (delta, oldDelta, source) => {
// // // 			console.log('Text change event!');
			
// // // 		  });
// // // 		}
// // // 	  }, [quill]);

// // // 	return (
// // // 		<div style={{ width: 'auto', height: 'auto' }}>
// // //       		<div ref={quillRef}/>
// // //     	</div>
// // // 	)
// // // };

// // // export default ReactQuillEditor;

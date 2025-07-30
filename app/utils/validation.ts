import { z } from "zod";

type FieldErrors = { [key: string]: string };

type FormFields = {
  [key: string]: FormDataEntryValue | FormDataEntryValue[]
}

//video - 127
function objectify(formData: FormData) {
  const formFields: FormFields = {}

  formData.forEach((value, name) => {
    const isArrayField = name.endsWith("[]");
    const fieldName = isArrayField ? name.slice(0, -2) : name;

    // console.log(fieldName in formFields);

    if (!(fieldName in formFields)) {
      formFields[fieldName] = isArrayField ? formData.getAll(name) : value
    }
    
  })

  // console.log(formFields, "25...");
  
  return formFields
}

export function validateForm<T>(
  formData: FormData,
  zodSchema: z.Schema<T>,
  successFn: (datassss: T) => unknown,
  errorFn: (errors: FieldErrors) => unknown
) {
  // const result = zodSchema.safeParse(Object.fromEntries(formData));
  const fields = objectify(formData)  
  // console.log(fields, "fields", typeof(fields.mealPlanMultiplier) );
  
  const result = zodSchema.safeParse(fields);
  console.log(result, "12");
  // console.log(Object.fromEntries(formData),"13")

  //   console.log("15",result.data, result.error, result.success, "15");

  if (!result.success) {
    const errors: FieldErrors = {}; // an object to store the list of errors, like minimum length 1, must be string
    result.error.issues.forEach((issue) => {
      const path = issue.path.join("."); // in the zod detailed issues, there are array of key or keys named path. to convert them array to string this forEach is created
      errors[path] = issue.message;
      // console.log(issue.message, "20");
    });
    // console.log(errors, "23");

    return errorFn(errors);
  }

  console.log(result.data, "56");

  return successFn(result.data);
}

// export function validateForm(formData: FormData) {
//     const result = saveShelfNameSchema.safeParse(Object.fromEntries(formData));

//     if (!result.success) {
//       const errors: FieldErrors = {};
//       result.error.issues.forEach((issue) => {
//         const path = issue.path.join(".");
//         errors[path] = issue.message;
//       });
//       return errors;
//     }

//     const { shelfName, shelfId } = result.data;

//     return saveShelfName(shelfName, shelfId);
//   }
